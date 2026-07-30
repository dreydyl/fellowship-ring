// Shared task: recommend an updated addiction severity level (1-5)
// from a ConfessionContext. Pulled out of recommend-severity/index.ts
// so the entry-guidance orchestrator can reuse it without a second
// buildConfessionContext round-trip.

import { callGloo } from '../glooClient.ts';
import { buildSeverityRecommendationPrompt } from '../prompts/severityRecommendation.ts';
import { parseNumericResponse } from '../parseNumericResponse.ts';
import type { ConfessionContext } from '../confessionContext.ts';

export async function runRecommendSeverity(ctx: ConfessionContext): Promise<number> {
  const responseText = await callGloo(buildSeverityRecommendationPrompt(ctx));
  return parseNumericResponse(responseText, 1, 5);
}
