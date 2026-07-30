// Edge function: generate-entry-guidance
//
// Entry-save orchestrator. Builds the shared ConfessionContext exactly
// once, then fans out across all of the Gloo AI generation tasks that
// normally each build their own context:
//   - assess-desperation
//   - generate-reading-plan
//   - generate-motivational
//   - recommend-severity
// via Promise.allSettled, so a slow/failed task doesn't block the
// others. As soon as assess-desperation resolves successfully,
// generate-guided-prayer is kicked off alongside the rest using that
// score (it is not part of the initial allSettled batch — it depends
// on one of that batch's results).
//
// Results are streamed back as newline-delimited JSON so the client can
// drive independent per-card loading states instead of waiting for the
// whole batch to finish:
//   { "target": "desperation", "status": "loading" }
//   { "target": "desperation", "status": "success", "data": { "desperationLevel": 6 } }
//   { "target": "desperation", "status": "error", "error": "..." }
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

type GuidanceTarget = 'desperation' | 'readingPlan' | 'motivational' | 'severity' | 'guidedPrayer';

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

  let ctx;
  try {
    ctx = await buildConfessionContext(userId, confessionEntryId);
  } catch (error) {
    const status = errorMessage(error) === 'Confession entry not found' ? 404 : 500;
    return new Response(JSON.stringify({ error: errorMessage(error) }), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createSupabaseAdminClient();
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

      // assess-desperation -> generate-guided-prayer chain. Guided
      // prayer only starts once desperation resolves, but runs
      // concurrently with the other three tasks below.
      const desperationChain = (async () => {
        let desperationLevel: number;
        try {
          desperationLevel = await runAssessDesperation(ctx);
          emit('desperation', { status: 'success', data: { desperationLevel } });
        } catch (error) {
          emit('desperation', { status: 'error', error: errorMessage(error) });
          return;
        }

        emit('guidedPrayer', { status: 'loading' });
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

      await Promise.allSettled([desperationChain, readingPlanTask, motivationalTask, severityTask]);

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'application/x-ndjson' },
  });
});
