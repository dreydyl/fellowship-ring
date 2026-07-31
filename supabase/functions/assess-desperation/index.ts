// Edge function: assess-desperation
//
// Given a confession_entry_id, asks Gloo AI (Responses API) how
// desperate the user appears right now (0-10, where 0 means the entry
// isn't actually a confession/journal entry about pornography recovery
// at all). This is an ephemeral signal used to select the guided-prayer
// tier — it is NOT persisted anywhere; the caller is responsible for
// passing it into generate-guided-prayer.
//
// Request body: { confessionEntryId: string }
// Requires an Authorization header with the caller's Supabase JWT.

import { createSupabaseAdminClient, getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';
import { buildConfessionContext } from '../_shared/confessionContext.ts';
import { runAssessDesperation } from '../_shared/tasks/assessDesperation.ts';
import { GlooProviderUnavailableError } from '../_shared/glooClient.ts';
import {
  RateLimitExceededError,
  formatRetryMessage,
  releaseAiCredit,
  reserveAiCredit,
} from '../_shared/rateLimiter.ts';

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

    const supabase = createSupabaseAdminClient();

    let eventId: string;
    try {
      ({ eventId } = await reserveAiCredit(supabase, userId, 'assess-desperation'));
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
      if (error instanceof Error && error.message === 'Confession entry not found') {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw error;
    }

    let desperationLevel: number;
    try {
      desperationLevel = await runAssessDesperation(ctx);
    } catch (error) {
      if (error instanceof GlooProviderUnavailableError) {
        await releaseAiCredit(supabase, eventId);
        return new Response(
          JSON.stringify({
            error: 'Our AI guidance service is temporarily unavailable. Please try again shortly.',
          }),
          { status: 503, headers: { 'content-type': 'application/json' } },
        );
      }
      throw error;
    }

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
