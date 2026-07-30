// Edge function: assess-desperation
//
// Given a confession_entry_id, asks Gloo AI (Responses API) how
// desperate the user appears right now (1-10). This is an ephemeral
// signal used to select the guided-prayer tier — it is NOT persisted
// anywhere; the caller is responsible for passing it into
// generate-guided-prayer.
//
// Request body: { confessionEntryId: string }
// Requires an Authorization header with the caller's Supabase JWT.

import { getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';
import { buildConfessionContext } from '../_shared/confessionContext.ts';
import { callGloo } from '../_shared/glooClient.ts';
import { buildDesperationPrompt } from '../_shared/prompts/desperation.ts';
import { parseNumericResponse } from '../_shared/parseNumericResponse.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    const { confessionEntryId } = await req.json();

    if (!confessionEntryId || typeof confessionEntryId !== 'string') {
      return new Response(JSON.stringify({ error: 'confessionEntryId is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    let ctx;
    try {
      ctx = await buildConfessionContext(userId, confessionEntryId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Confession entry not found') {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw error;
    }

    const responseText = await callGloo(buildDesperationPrompt(ctx));
    const desperationLevel = parseNumericResponse(responseText, 1, 10);

    return new Response(JSON.stringify({ desperationLevel }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
});
