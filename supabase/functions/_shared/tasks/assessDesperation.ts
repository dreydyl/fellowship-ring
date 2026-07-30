// Shared task: assess how desperate the user appears (1-10) from a
// ConfessionContext. Pulled out of assess-desperation/index.ts so the
// entry-guidance orchestrator can reuse it without a second
// buildConfessionContext round-trip.

import { callGloo } from '../glooClient.ts';
import { buildDesperationPrompt } from '../prompts/desperation.ts';
import { parseNumericResponse } from '../parseNumericResponse.ts';
import type { ConfessionContext } from '../confessionContext.ts';

export async function runAssessDesperation(ctx: ConfessionContext): Promise<number> {
  const responseText = await callGloo(buildDesperationPrompt(ctx));
  return parseNumericResponse(responseText, 1, 10);
}
