// TEMPORARY scratch function used only to verify GlooProviderUnavailableError
// classification (402/429/5xx -> unavailable, other 4xx -> plain Error) by
// mocking fetch. Not part of the app; delete after verification.

import { callGloo, GlooProviderUnavailableError } from '../_shared/glooClient.ts';
import { createSupabaseAdminClient } from '../_shared/supabaseAdmin.ts';
import { reserveAiCredit, releaseAiCredit } from '../_shared/rateLimiter.ts';

const originalFetch = globalThis.fetch;
const TEST_USER_ID = 'f3faf5fb-b54b-4d4e-bbf4-23691de22061';

async function runRefundScenario() {
  const supabase = createSupabaseAdminClient();
  const before = await supabase
    .from('ai_usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', TEST_USER_ID);
  const { eventId } = await reserveAiCredit(supabase, TEST_USER_ID, 'scratch-refund-test');
  const afterReserve = await supabase
    .from('ai_usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', TEST_USER_ID);
  await releaseAiCredit(supabase, eventId);
  const afterRelease = await supabase
    .from('ai_usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', TEST_USER_ID);
  return {
    countBefore: before.count,
    countAfterReserve: afterReserve.count,
    countAfterRelease: afterRelease.count,
    refundWorked: afterRelease.count === before.count && afterReserve.count === (before.count ?? 0) + 1,
  };
}

async function runScenario(responsesStatus: number): Promise<{ status: number; result: string }> {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/oauth2/token')) {
      return Promise.resolve(
        new Response(JSON.stringify({ access_token: 'fake-token', expires_in: 3600 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    }
    if (url.includes('/ai/v1/responses')) {
      return Promise.resolve(
        new Response('simulated provider error body', { status: responsesStatus }),
      );
    }
    return originalFetch(input, init);
  }) as typeof fetch;

  try {
    await callGloo({ messages: [{ role: 'user', content: 'test' }] });
    return { status: responsesStatus, result: 'no error thrown (unexpected)' };
  } catch (error) {
    if (error instanceof GlooProviderUnavailableError) {
      return { status: responsesStatus, result: `GlooProviderUnavailableError (status=${error.status})` };
    }
    return { status: responsesStatus, result: `plain Error: ${(error as Error).message}` };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

Deno.serve(async () => {
  const results = [];
  for (const status of [429, 402, 500, 503, 400, 401]) {
    results.push(await runScenario(status));
  }
  const refund = await runRefundScenario();
  return new Response(JSON.stringify({ providerErrorClassification: results, refund }, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
});
