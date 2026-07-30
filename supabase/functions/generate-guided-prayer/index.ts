// Edge function: generate-guided-prayer
//
// Given a confession_entry_id and a desperation level (computed
// separately by assess-desperation and passed in, not recomputed
// here), generates a tiered guided prayer via Gloo AI Completions V2
// and stores it in guided_prayers.
//
// Request body: { confessionEntryId: string, desperationLevel: number }
// Requires an Authorization header with the caller's Supabase JWT.

import { createSupabaseAdminClient, getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';
import { buildConfessionContext } from '../_shared/confessionContext.ts';
import { runGenerateGuidedPrayer } from '../_shared/tasks/generateGuidedPrayer.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    const { confessionEntryId, desperationLevel } = await req.json();

    if (!confessionEntryId || typeof confessionEntryId !== 'string') {
      return new Response(JSON.stringify({ error: 'confessionEntryId is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (
      typeof desperationLevel !== 'number' ||
      !Number.isFinite(desperationLevel) ||
      desperationLevel < 1 ||
      desperationLevel > 10
    ) {
      return new Response(
        JSON.stringify({ error: 'desperationLevel must be a number between 1 and 10' }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
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
    const guidedPrayer = await runGenerateGuidedPrayer(
      supabase,
      userId,
      confessionEntryId,
      ctx,
      desperationLevel,
    );

    return new Response(JSON.stringify(guidedPrayer), {
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
