// TEMPORARY debug edge function for manually inspecting the Group B
// Gloo AI prompt builders' output for a given confession entry.
//
// Not part of the product surface — safe to delete once prompt
// tuning/testing is done.
//
// Request body: { confessionEntryId: string }
// Requires an Authorization header with the caller's Supabase JWT.

import { getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';
import { buildConfessionContext } from '../_shared/confessionContext.ts';
import { buildDesperationPrompt } from '../_shared/prompts/desperation.ts';
import { buildReadingPlanPrompt } from '../_shared/prompts/readingPlan.ts';
import { buildMotivationalPrompt } from '../_shared/prompts/motivational.ts';
import { buildGuidedPrayerPrompt } from '../_shared/prompts/guidedPrayer.ts';
import { buildSeverityRecommendationPrompt } from '../_shared/prompts/severityRecommendation.ts';

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

    const ctx = await buildConfessionContext(userId, confessionEntryId);

    // Guided prayer's tiering depends on a desperation level. Since this
    // is a dry-run inspector (no live Gloo calls), just show all three
    // tiers rather than picking one.
    const result = {
      desperationPrompt: buildDesperationPrompt(ctx),
      readingPlanPrompt: buildReadingPlanPrompt(ctx),
      motivationalPrompt: buildMotivationalPrompt(ctx),
      guidedPrayerPrompt_joyful: buildGuidedPrayerPrompt(ctx, 3),
      guidedPrayerPrompt_peaceful: buildGuidedPrayerPrompt(ctx, 6),
      guidedPrayerPrompt_zealous: buildGuidedPrayerPrompt(ctx, 9),
      severityRecommendationPrompt: buildSeverityRecommendationPrompt(ctx),
    };

    return new Response(JSON.stringify(result, null, 2), {
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
