// Edge function: recommend-severity
//
// Given a confession_entry_id, asks Gloo AI (Responses API) to
// recommend an updated addiction severity level (1-5) based on recent
// confession history and self-reported severity. Returns the
// recommendation only — it does NOT write to addiction_assessments.
// The client inserts that row itself, only after the user explicitly
// accepts the recommendation (see P7).
//
// Request body: { confessionEntryId: string }
// Requires an Authorization header with the caller's Supabase JWT.

import { getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';
import { buildConfessionContext } from '../_shared/confessionContext.ts';
import { callGloo } from '../_shared/glooClient.ts';
import { buildSeverityRecommendationPrompt } from '../_shared/prompts/severityRecommendation.ts';
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

    const responseText = await callGloo(buildSeverityRecommendationPrompt(ctx));
    const recommendedSeverity = parseNumericResponse(responseText, 1, 5);

    return new Response(JSON.stringify({ recommendedSeverity }), {
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
