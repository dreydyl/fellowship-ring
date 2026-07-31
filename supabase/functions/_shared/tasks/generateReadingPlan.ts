// Shared task: weave a short narrative + Bible reading plan and store
// it in reading_plans. Pulled out of generate-reading-plan/index.ts so
// the entry-guidance orchestrator can reuse it without a second
// buildConfessionContext round-trip.
//
// plan_json is versioned. v2 shape:
//   { version: 2, passages: [{ number, reference }] }

import { createSupabaseAdminClient } from '../supabaseAdmin.ts';
import { callGloo } from '../glooClient.ts';
import { buildReadingPlanPrompt } from '../prompts/readingPlan.ts';
import type { ConfessionContext } from '../confessionContext.ts';

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

interface ReadingPlanPassage {
  number: number;
  reference: string;
}

interface ReadingPlanResponse {
  title: string;
  narrative: string;
  passages: ReadingPlanPassage[];
}

export interface ReadingPlanResult {
  id: string;
  title: string;
  description: string | null;
  plan_json: unknown;
  created_at: string;
}

export async function runGenerateReadingPlan(
  supabase: AdminClient,
  userId: string,
  confessionEntryId: string,
  ctx: ConfessionContext,
): Promise<ReadingPlanResult> {
  const responseText = await callGloo(buildReadingPlanPrompt(ctx));

  let parsed: ReadingPlanResponse;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Gloo AI returned non-JSON response: ${responseText}`);
    }
    parsed = JSON.parse(match[0]);
  }

  const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
  const narrative = typeof parsed.narrative === 'string' ? parsed.narrative.trim() : '';
  const passages: ReadingPlanPassage[] = Array.isArray(parsed.passages)
    ? parsed.passages
        .filter(
          (passage): passage is ReadingPlanPassage =>
            typeof passage?.reference === 'string' && passage.reference.trim().length > 0,
        )
        .map((passage, index) => ({
          number: typeof passage.number === 'number' ? passage.number : index + 1,
          reference: passage.reference.trim(),
        }))
    : [];

  if (!title || !passages.length) {
    throw new Error(`Gloo AI response missing required fields: ${responseText}`);
  }

  const { data: plan, error: insertError } = await supabase
    .from('reading_plans')
    .insert({
      user_id: userId,
      confession_entry_id: confessionEntryId,
      title,
      description: narrative || null,
      plan_json: { version: 2, passages },
    })
    .select('id, title, description, plan_json, created_at')
    .single();

  if (insertError) throw insertError;
  return plan;
}
