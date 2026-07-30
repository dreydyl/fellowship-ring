// Shared task: generate a short motivational affirmation +
// exhortation and store it in guidance_records. Pulled out of
// generate-motivational/index.ts so the entry-guidance orchestrator
// can reuse it without a second buildConfessionContext round-trip.

import { createSupabaseAdminClient } from '../supabaseAdmin.ts';
import { callGlooCompletion } from '../glooClient.ts';
import { buildMotivationalPrompt } from '../prompts/motivational.ts';
import type { ConfessionContext } from '../confessionContext.ts';

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export interface GuidanceRecordResult {
  id: string;
  confession_entry_id: string;
  content: string;
  created_at: string;
}

export async function runGenerateMotivational(
  supabase: AdminClient,
  userId: string,
  confessionEntryId: string,
  ctx: ConfessionContext,
): Promise<GuidanceRecordResult> {
  const content = (await callGlooCompletion(buildMotivationalPrompt(ctx))).trim();

  const { data, error } = await supabase
    .from('guidance_records')
    .insert({
      user_id: userId,
      confession_entry_id: confessionEntryId,
      content,
    })
    .select('id, confession_entry_id, content, created_at')
    .single();

  if (error) throw error;
  return data;
}
