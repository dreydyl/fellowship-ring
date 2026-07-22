// Shared Anthropic (Claude) API client for edge functions.
//
// Reads ANTHROPIC_API_KEY from the function's environment (set via
// `supabase secrets set ANTHROPIC_API_KEY=...`).

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CallClaudeOptions {
  system?: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
  model?: string;
}

/**
 * Calls the Anthropic Messages API and returns the concatenated text
 * content of the response.
 */
export async function callClaude({
  system,
  messages,
  maxTokens = 1024,
  model = DEFAULT_MODEL,
}: CallClaudeOptions): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const textBlocks = (data.content ?? [])
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text);

  return textBlocks.join('\n').trim();
}
