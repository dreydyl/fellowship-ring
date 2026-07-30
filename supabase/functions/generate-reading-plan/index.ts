// Edge function: generate-reading-plan
//
// Given a confession_entry_id, uses the shared confession context +
// buildReadingPlanPrompt + callGloo (Responses API) to weave a short
// narrative on the user's identity in Christ, grounded in one or more
// Bible passages, and inserts the result into reading_plans.
//
// plan_json is now versioned. v2 shape:
//   { version: 2, passages: [{ number, reference, summary }] }
// (v1 rows from before this rewrite only had `{ version: 1, passages:
// [{ reference }] }` — the frontend types tolerate both.)
//
// Request body: { confessionEntryId: string }
// Requires an Authorization header with the caller's Supabase JWT.

import { createSupabaseAdminClient, getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';
import { buildConfessionContext } from '../_shared/confessionContext.ts';
import { callGloo } from '../_shared/glooClient.ts';
import { buildReadingPlanPrompt } from '../_shared/prompts/readingPlan.ts';

interface ReadingPlanPassage {
  number: number;
  reference: string;
  summary: string;
}

interface ReadingPlanResponse {
  title: string;
  narrative: string;
  passages: ReadingPlanPassage[];
}

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

    const responseText = await callGloo(buildReadingPlanPrompt(ctx));

    let parsed: ReadingPlanResponse;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error(`Gloo AI returned non-JSON response: ${responseText}`);
      }
      parsed = JSON.parse(match[0]);
    }

    const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const narrative = typeof parsed.narrative === 'string' ? parsed.narrative.trim() : '';
    const passages: ReadingPlanPassage[] = Array.isArray(parsed.passages)
      ? parsed.passages
          .filter(
            (passage): passage is ReadingPlanPassage =>
              typeof passage?.reference === 'string' && passage.reference.trim().length > 0,
          )
          .map((passage, index) => ({
            number: typeof passage.number === 'number' ? passage.number : index + 1,
            reference: passage.reference.trim(),
            summary: typeof passage.summary === 'string' ? passage.summary.trim() : '',
          }))
      : [];

    if (!title || !passages.length) {
      throw new Error(`Gloo AI response missing required fields: ${responseText}`);
    }

    const supabase = createSupabaseAdminClient();

    const { data: plan, error: insertError } = await supabase
      .from('reading_plans')
      .insert({
        user_id: userId,
        confession_entry_id: confessionEntryId,
        title,
        description: narrative || null,
        plan_json: { version: 2, passages },
      })
      .select('id, title, description, plan_json, created_at')
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify(plan), {
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
