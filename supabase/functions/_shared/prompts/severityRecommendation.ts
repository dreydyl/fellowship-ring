// Prompt builder for "Recommend New Addiction Severity" (prompt #5).
//
// Endpoint: Responses API (callGloo). Temperature: low.
// Expects a bare number (1-5) back — no JSON, no prose.

import type { ConfessionContext } from '../confessionContext.ts';
import type { GlooMessage } from '../glooClient.ts';
import { getRelationalTerms } from './pronouns.ts';
import { formatEntryHistory, formatAddictionSeverity } from './formatting.ts';

export interface GlooPromptRequest {
  instructions: string;
  messages: GlooMessage[];
  temperature: number;
}

const TEMPERATURE_LOW = 0.2;

export function buildSeverityRecommendationPrompt(ctx: ConfessionContext): GlooPromptRequest {
  const { relation, possessive } = getRelationalTerms(ctx.gender);

  const instructions = `You are a Christian therapist who understands the struggle of habitual sin and \
the thorns of flesh. You are assigned to help a ${relation} in Christ recenter and regulate ${possessive} \
physiology and spirit after ${possessive} confession just now. Consider how frequently they confess and \
how strong their urges have been.

On a scale of 1-5, how severe is their addiction? Respond with ONLY the bare number \
(e.g. "3") — no words, no punctuation, no explanation.`;

  const input = `Their confession just now: "${ctx.entry.content}"

These were their last 7 confessions:
${formatEntryHistory(ctx.last7Entries)}

Their current addiction severity:
${formatAddictionSeverity(ctx.addictionSeverity)}`;

  return {
    instructions,
    messages: [{ role: 'user', content: input }],
    temperature: TEMPERATURE_LOW,
  };
}
