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
import { runGenerateReadingPlan } from '../_shared/tasks/generateReadingPlan.ts';

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

    const supabase = createSupabaseAdminClient();
    const plan = await runGenerateReadingPlan(supabase, userId, confessionEntryId, ctx);

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
