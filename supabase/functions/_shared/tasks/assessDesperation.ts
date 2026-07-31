// Shared task: assess how desperate the user appears (0-10) from a
// ConfessionContext. Pulled out of assess-desperation/index.ts so the
// entry-guidance orchestrator can reuse it without a second
// buildConfessionContext round-trip.
//
// A result of 0 means the entry has nothing to do with confession or
// recovery — callers must treat that as "disregard this entry" rather
// than a low desperation score (see generate-entry-guidance, which
// skips every downstream Gloo AI task when this returns 0).

import { callGloo } from '../glooClient.ts';
import { buildDesperationPrompt } from '../prompts/desperation.ts';
import { parseNumericResponse } from '../parseNumericResponse.ts';
import type { ConfessionContext } from '../confessionContext.ts';

export async function runAssessDesperation(ctx: ConfessionContext): Promise<number> {
  const responseText = await callGloo(buildDesperationPrompt(ctx));
  return parseNumericResponse(responseText, 0, 10);
}
