// Edge function: youversion-passage
//
// Accepts a Bible reference such as "Philippians 4:12-13" and proxies it to
// a configured YouVersion-compatible endpoint, returning the verse text.
//
// Configuration:
//   - YOUVERSION_API_URL: the endpoint to call. It may include a {reference}
//     placeholder, or it can be a base URL with a reference query param appended.
//   - YOUVERSION_API_KEY: bearer token (optional, depending on provider).
//
// The function requires an Authorization header so it can resolve the calling
// user via the Supabase anon client.

import { getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';
import { withCors } from '../_shared/cors.ts';

function buildUrl(reference: string): string {
  const baseUrl = Deno.env.get('YOUVERSION_API_URL');
  if (!baseUrl) {
    throw new Error('YOUVERSION_API_URL is not configured');
  }

  if (baseUrl.includes('{reference}')) {
    return baseUrl.replace('{reference}', encodeURIComponent(reference));
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('reference', reference);
    return url.toString();
  } catch {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}reference=${encodeURIComponent(reference)}`;
  }
}

function extractText(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    const candidates: unknown[] = [
      record.text,
      record.content,
      record.verse,
      record.passage,
      record.data,
      record.result,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        return candidate;
      }

      if (candidate && typeof candidate === 'object') {
        const nested = candidate as Record<string, unknown>;
        if (typeof nested.text === 'string') {
          return nested.text;
        }
        if (typeof nested.content === 'string') {
          return nested.content;
        }
        if (typeof nested.verseText === 'string') {
          return nested.verseText;
        }
        if (Array.isArray(nested.verses)) {
          const verses = nested.verses as Array<Record<string, unknown>>;
          const textChunks = verses
            .map((verse) => (typeof verse.text === 'string' ? verse.text : null))
            .filter((value): value is string => Boolean(value));
          if (textChunks.length) {
            return textChunks.join('\n');
          }
        }
      }
    }
  }

  throw new Error('Unsupported YouVersion response shape');
}

Deno.serve(withCors(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    await getUserIdFromRequest(req);
    const { reference } = await req.json();

    if (!reference || typeof reference !== 'string') {
      return new Response(JSON.stringify({ error: 'reference is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const apiUrl = buildUrl(reference);
    const apiKey = Deno.env.get('YOUVERSION_API_KEY');

    const headers: HeadersInit = {
      'content-type': 'application/json',
    };

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      const errorBody = await response.text();
      return new Response(
        JSON.stringify({ error: `YouVersion lookup failed (${response.status}): ${errorBody}` }),
        {
          status: 502,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    const payload = await response.json();
    const text = extractText(payload);

    return new Response(
      JSON.stringify({ reference, text, source: 'youversion' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}));
