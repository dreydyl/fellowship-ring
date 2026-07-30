// Shared task: generate a desperation-tiered guided prayer and store
// it in guided_prayers. Pulled out of generate-guided-prayer/index.ts
// so the entry-guidance orchestrator can reuse it without a second
// buildConfessionContext round-trip.

import { createSupabaseAdminClient } from '../supabaseAdmin.ts';
import { callGlooCompletion } from '../glooClient.ts';
import { buildGuidedPrayerPrompt } from '../prompts/guidedPrayer.ts';
import type { ConfessionContext } from '../confessionContext.ts';

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export interface GuidedPrayerResult {
  id: string;
  confession_entry_id: string;
  content: string;
  desperation_level: number | null;
  created_at: string;
}

export async function runGenerateGuidedPrayer(
  supabase: AdminClient,
  userId: string,
  confessionEntryId: string,
  ctx: ConfessionContext,
  desperationLevel: number,
): Promise<GuidedPrayerResult> {
  const content = (
    await callGlooCompletion(buildGuidedPrayerPrompt(ctx, desperationLevel))
  ).trim();

  const { data, error } = await supabase
    .from('guided_prayers')
    .insert({
      user_id: userId,
      confession_entry_id: confessionEntryId,
      content,
      desperation_level: desperationLevel,
    })
    .select('id, confession_entry_id, content, desperation_level, created_at')
    .single();

  if (error) throw error;
  return data;
}
