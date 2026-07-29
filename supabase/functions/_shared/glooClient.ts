// Shared Gloo AI client for edge functions.
//
// Gloo AI uses OAuth2 client credentials: exchange GLOO_CLIENT_ID /
// GLOO_CLIENT_SECRET for a short-lived (1hr) bearer access token, then
// call the Responses API with that token. Configure secrets with:
//
//   supabase secrets set GLOO_CLIENT_ID=... GLOO_CLIENT_SECRET=...
//
// Docs: https://docs.gloo.com/getting-started/quickstart-developers

const GLOO_TOKEN_URL = 'https://platform.ai.gloo.com/oauth2/token';
const GLOO_RESPONSES_URL = 'https://platform.ai.gloo.com/ai/v1/responses';
const GLOO_COMPLETIONS_URL = 'https://platform.ai.gloo.com/ai/v2/chat/completions';
const DEFAULT_MODEL = 'gloo-openai-gpt-5-mini';

// Access tokens are valid for 1 hour; cache within the function's warm
// lifetime and refresh a little before actual expiry.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const clientId = Deno.env.get('GLOO_CLIENT_ID');
  const clientSecret = Deno.env.get('GLOO_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('GLOO_CLIENT_ID / GLOO_CLIENT_SECRET are not set');
  }

  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(GLOO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'api/access',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gloo AI token exchange failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const accessToken: string = data.access_token;
  const expiresInSeconds: number = data.expires_in ?? 3600;

  // Refresh 60s early to avoid using a token that expires mid-request.
  cachedToken = {
    accessToken,
    expiresAt: Date.now() + (expiresInSeconds - 60) * 1000,
  };

  return accessToken;
}

export interface GlooMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CallGlooOptions {
  instructions?: string;
  messages: GlooMessage[];
  model?: string;
  temperature?: number;
}

/**
 * Calls the Gloo AI Responses API and returns the concatenated text
 * content of the assistant's message.
 */
export async function callGloo({
  instructions,
  messages,
  model = DEFAULT_MODEL,
  temperature,
}: CallGlooOptions): Promise<string> {
  const accessToken = await getAccessToken();

  const response = await fetch(GLOO_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      model,
      instructions,
      input: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      ...(temperature !== undefined ? { temperature } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gloo AI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const output = data.output ?? [];
  const message = output.find((item: { type: string }) => item.type === 'message');
  if (!message) {
    throw new Error('Gloo AI response did not contain a message output item');
  }

  const textBlocks = (message.content ?? [])
    .filter((block: { type: string }) => block.type === 'output_text')
    .map((block: { text: string }) => block.text);

  return textBlocks.join('\n');
}

export interface CallGlooCompletionOptions {
  instructions?: string;
  messages: GlooMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Calls the Gloo AI Completions V2 API (`/ai/v2/chat/completions`) and
 * returns the assistant's message content. Use this instead of
 * `callGloo` when you need Gloo's governed path (guardrails, output
 * moderation, values-alignment/`tradition`, intelligent routing).
 */
export async function callGlooCompletion({
  instructions,
  messages,
  model = DEFAULT_MODEL,
  maxTokens,
  temperature,
}: CallGlooCompletionOptions): Promise<string> {
  const accessToken = await getAccessToken();

  const chatMessages = [
    ...(instructions ? [{ role: 'system', content: instructions }] : []),
    ...messages.map((message) => ({ role: message.role, content: message.content })),
  ];

  const response = await fetch(GLOO_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      model,
      messages: chatMessages,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gloo AI Completions API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Gloo AI Completions response did not contain message content');
  }

  return content;
}
