// Prompt builder for "Determine Desperation Level" (prompt #1).
//
// Endpoint: Responses API (callGloo). Temperature: low.
// Expects a bare number (0-10) back — no JSON, no prose. 0 is a
// special case meaning the entry isn't actually a confession/journal
// entry about pornography recovery at all (see runAssessDesperation /
// generate-entry-guidance for how that short-circuits the rest of the
// guidance pipeline).

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

export function buildDesperationPrompt(ctx: ConfessionContext): GlooPromptRequest {
  const { relation, possessive } = getRelationalTerms(ctx.gender);

  const instructions = `You are a Christian therapist who understands the struggle of habitual sin and \
the thorns of flesh. You are assigned to help a ${relation} in Christ recenter and regulate ${possessive} \
physiology and spirit after ${possessive} confession just now.

First, check whether their entry is actually a confession or journal entry about pornography/lust \
struggle, temptation, relapse, victory, or recovery. If it clearly is NOT about any of that — e.g. \
off-topic chatter, a test message, or unrelated content — respond with 0.

Otherwise, on a scale of 1-10, how severe is their desperation today?

Respond with ONLY the bare number (e.g. "7" or "0") — no words, no punctuation, no explanation.`;

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
