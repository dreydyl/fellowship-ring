// Shared per-user AI-generation rate limiter ("credits") for edge
// functions that call Gloo AI.
//
// Writing confession entries themselves is never limited — only the
// Gloo-calling edge functions reserve a credit here before doing any
// AI work. Each reservation is a row in `ai_usage_events` (see
// migration 0010_ai_usage_events.sql). The limit is enforced as a
// rolling window: a user may make AI_CREDIT_LIMIT calls in any
// trailing AI_CREDIT_WINDOW_HOURS hours, and all rate-limited actions
// share the same bucket (there isn't a separate quota per function).

import type { createSupabaseAdminClient } from './supabaseAdmin.ts';

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export const AI_CREDIT_LIMIT = 3;
export const AI_CREDIT_WINDOW_HOURS = 24;

export class RateLimitExceededError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super('AI generation rate limit exceeded');
    this.name = 'RateLimitExceededError';
  }
}

/**
 * Reserves one of the user's AI-generation credits, throwing
 * `RateLimitExceededError` if they've already used `AI_CREDIT_LIMIT`
 * within the trailing `AI_CREDIT_WINDOW_HOURS`. On success, inserts a
 * new `ai_usage_events` row and returns its id so the caller can
 * `releaseAiCredit` it back if the downstream Gloo call fails due to
 * a provider-side outage (see `GlooProviderUnavailableError` in
 * glooClient.ts) — normal task failures should NOT be refunded.
 */
export async function reserveAiCredit(
  supabase: AdminClient,
  userId: string,
  action: string,
): Promise<{ eventId: string }> {
  const windowStart = new Date(Date.now() - AI_CREDIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data: recentEvents, error: selectError } = await supabase
    .from('ai_usage_events')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: true });

  if (selectError) throw selectError;

  if ((recentEvents?.length ?? 0) >= AI_CREDIT_LIMIT) {
    const oldest = new Date(recentEvents![0].created_at).getTime();
    const retryAfterMs = oldest + AI_CREDIT_WINDOW_HOURS * 60 * 60 * 1000 - Date.now();
    throw new RateLimitExceededError(Math.max(retryAfterMs, 0));
  }

  const { data: inserted, error: insertError } = await supabase
    .from('ai_usage_events')
    .insert({ user_id: userId, action })
    .select('id')
    .single();

  if (insertError) throw insertError;

  return { eventId: inserted.id };
}

/**
 * Deletes a previously reserved credit. Only call this to refund a
 * credit when the downstream Gloo call never actually delivered a
 * result due to a provider-side outage.
 */
export async function releaseAiCredit(supabase: AdminClient, eventId: string): Promise<void> {
  const { error } = await supabase.from('ai_usage_events').delete().eq('id', eventId);
  if (error) throw error;
}

/**
 * Friendly copy for a 429 response body when `reserveAiCredit` throws
 * `RateLimitExceededError`.
 */
export function formatRetryMessage(retryAfterMs: number): string {
  const totalMinutes = Math.max(Math.ceil(retryAfterMs / 60_000), 1);

  let when: string;
  if (totalMinutes < 60) {
    when = `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    when = minutes > 0
      ? `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`
      : `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `You've reached today's limit of ${AI_CREDIT_LIMIT} AI-generated responses. You can still write confessions any time — try generating a response again in about ${when}.`;
}
