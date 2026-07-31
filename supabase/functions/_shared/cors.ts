// Shared CORS handling for edge functions called directly from the
// browser (via fetch), since the Supabase edge runtime does not add
// CORS headers automatically. Without this, browsers block both the
// preflight OPTIONS request and the real response with:
//   "No 'Access-Control-Allow-Origin' header is present"
//
// Origin is left as "*" (not a specific domain) because these
// endpoints authenticate via a Bearer JWT in the Authorization header,
// not cookies — there's no ambient credential a wildcard origin could
// help an attacker steal.

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Wraps a Deno.serve handler: answers CORS preflight requests directly,
// and merges corsHeaders onto whatever Response the handler returns
// (including streamed responses) without needing to touch every
// individual `new Response(...)` call site inside the handler.
export function withCors(
  handler: (req: Request) => Promise<Response> | Response,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const response = await handler(req);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value);
    }
    return new Response(response.body, { status: response.status, headers });
  };
}
