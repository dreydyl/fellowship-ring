// Edge function: generate-entry-guidance
//
// Entry-save orchestrator. Builds the shared ConfessionContext exactly
// once, then runs assess-desperation first, since every other task
// depends on its result:
//   - desperationLevel === 0 means the entry isn't actually a
//     confession/journal entry about pornography recovery. Rather than
//     reinterpreting or forcing unrelated text into the confession
//     workflow, none of the other Gloo AI tasks are run at all — the
//     client gets a "disregarded" event with a fallback message for
//     each of them instead of fabricated guidance.
//   - desperationLevel > 0 fans out across the remaining tasks
//     (generate-reading-plan, generate-motivational, recommend-severity)
//     via Promise.allSettled, so a slow/failed task doesn't block the
//     others, then kicks off generate-guided-prayer using that score.
//
// Results are streamed back as newline-delimited JSON so the client can
// drive independent per-card loading states instead of waiting for the
// whole batch to finish:
//   { "target": "desperation", "status": "loading" }
//   { "target": "desperation", "status": "success", "data": { "desperationLevel": 6 } }
//   { "target": "desperation", "status": "error", "error": "..." }
//   { "target": "motivational", "status": "disregarded", "message": "..." }
//
// Targets: desperation | readingPlan | motivational | severity | guidedPrayer
//
// Request body: { confessionEntryId: string }
// Requires an Authorization header with the caller's Supabase JWT.

import { createSupabaseAdminClient, getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';
import { buildConfessionContext } from '../_shared/confessionContext.ts';
import { runAssessDesperation } from '../_shared/tasks/assessDesperation.ts';
import { runRecommendSeverity } from '../_shared/tasks/recommendSeverity.ts';
import { runGenerateMotivational } from '../_shared/tasks/generateMotivational.ts';
import { runGenerateReadingPlan } from '../_shared/tasks/generateReadingPlan.ts';
import { runGenerateGuidedPrayer } from '../_shared/tasks/generateGuidedPrayer.ts';
import { DISREGARDED_MESSAGE } from '../_shared/guidanceFallback.ts';
import { GlooProviderUnavailableError } from '../_shared/glooClient.ts';
import {
  RateLimitExceededError,
  formatRetryMessage,
  releaseAiCredit,
  reserveAiCredit,
} from '../_shared/rateLimiter.ts';

type GuidanceTarget = 'desperation' | 'readingPlan' | 'motivational' | 'severity' | 'guidedPrayer';

const DOWNSTREAM_TARGETS: readonly GuidanceTarget[] = [
  'readingPlan',
  'motivational',
  'severity',
  'guidedPrayer',
];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let userId: string;
  try {
    userId = await getUserIdFromRequest(req);
  } catch (error) {
    return new Response(JSON.stringify({ error: errorMessage(error) }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { confessionEntryId } = await req.json().catch(() => ({}));

  if (!confessionEntryId || typeof confessionEntryId !== 'string') {
    return new Response(JSON.stringify({ error: 'confessionEntryId is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createSupabaseAdminClient();

  let eventId: string;
  try {
    ({ eventId } = await reserveAiCredit(supabase, userId, 'generate-entry-guidance'));
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return new Response(JSON.stringify({ error: formatRetryMessage(error.retryAfterMs) }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      });
    }
    throw error;
  }

  let ctx;
  try {
    ctx = await buildConfessionContext(userId, confessionEntryId);
  } catch (error) {
    await releaseAiCredit(supabase, eventId);
    const status = errorMessage(error) === 'Confession entry not found' ? 404 : 500;
    return new Response(JSON.stringify({ error: errorMessage(error) }), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function emit(target: GuidanceTarget, payload: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`${JSON.stringify({ target, ...payload })}\n`));
      }

      emit('desperation', { status: 'loading' });
      emit('readingPlan', { status: 'loading' });
      emit('motivational', { status: 'loading' });
      emit('severity', { status: 'loading' });

      let desperationLevel: number;
      try {
        desperationLevel = await runAssessDesperation(ctx);
        emit('desperation', { status: 'success', data: { desperationLevel } });
      } catch (error) {
        if (error instanceof GlooProviderUnavailableError) {
          await releaseAiCredit(supabase, eventId);
          const unavailableMessage =
            'Our AI guidance service is temporarily unavailable. Please try again shortly.';
          emit('desperation', { status: 'error', error: unavailableMessage });
          DOWNSTREAM_TARGETS.forEach((target) =>
            emit(target, { status: 'error', error: unavailableMessage }),
          );
        } else {
          emit('desperation', { status: 'error', error: errorMessage(error) });
          DOWNSTREAM_TARGETS.forEach((target) =>
            emit(target, { status: 'error', error: 'Skipped — could not assess this entry.' }),
          );
        }
        controller.close();
        return;
      }

      // Persist the assessed level onto the entry itself so future
      // entries' formatEntryHistory can exclude it if it's a 0 (see
      // migration 0009). Best-effort — a failure here shouldn't block
      // the rest of the guidance pipeline.
      const { error: persistError } = await supabase
        .from('confession_entries')
        .update({ desperation_level: desperationLevel })
        .eq('id', confessionEntryId);
      if (persistError) {
        console.error('Failed to persist desperation_level:', persistError);
      }

      // A desperation level of 0 means Gloo AI determined this entry
      // isn't actually a confession/journal entry about pornography
      // recovery at all. Fail gracefully instead of reinterpreting or
      // forcing unrelated text into the confession workflow: skip every
      // downstream task entirely and hand the client a fallback message
      // instead of fabricated guidance.
      if (desperationLevel === 0) {
        DOWNSTREAM_TARGETS.forEach((target) =>
          emit(target, { status: 'disregarded', message: DISREGARDED_MESSAGE }),
        );
        controller.close();
        return;
      }

      emit('guidedPrayer', { status: 'loading' });

      const guidedPrayerTask = (async () => {
        try {
          const guidedPrayer = await runGenerateGuidedPrayer(
            supabase,
            userId,
            confessionEntryId,
            ctx,
            desperationLevel,
          );
          emit('guidedPrayer', { status: 'success', data: guidedPrayer });
        } catch (error) {
          emit('guidedPrayer', { status: 'error', error: errorMessage(error) });
        }
      })();

      const readingPlanTask = runGenerateReadingPlan(supabase, userId, confessionEntryId, ctx)
        .then((data) => emit('readingPlan', { status: 'success', data }))
        .catch((error) => emit('readingPlan', { status: 'error', error: errorMessage(error) }));

      const motivationalTask = runGenerateMotivational(supabase, userId, confessionEntryId, ctx)
        .then((data) => emit('motivational', { status: 'success', data }))
        .catch((error) => emit('motivational', { status: 'error', error: errorMessage(error) }));

      const severityTask = runRecommendSeverity(ctx)
        .then((recommendedSeverity) =>
          emit('severity', { status: 'success', data: { recommendedSeverity } }),
        )
        .catch((error) => emit('severity', { status: 'error', error: errorMessage(error) }));

      await Promise.allSettled([guidedPrayerTask, readingPlanTask, motivationalTask, severityTask]);

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'application/x-ndjson' },
  });
});
