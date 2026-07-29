// Prompt builder for "Generate Guided Prayer" (prompt #4).
//
// Endpoint: Completions V2 (callGlooCompletion). Temperature: high.
// Expects plain text back (no JSON, no markdown) — a prayer modeled
// on the Lord's Prayer, tiered by desperation level:
//   1-4  -> joyful, 7 sentences
//   5-7  -> peaceful, 2 paragraphs / 14 sentences
//   8-10 -> zealous, 3 paragraphs
//
// Uses only the last 3 confessions (not 7), per the original spec.

import type { ConfessionContext } from '../confessionContext.ts';
import type { GlooMessage } from '../glooClient.ts';
import { getRelationalTerms } from './pronouns.ts';
import { formatEntryHistory, formatSelfReportedSeverity } from './formatting.ts';

export interface GlooPromptRequest {
  instructions: string;
  messages: GlooMessage[];
  temperature: number;
}

const TEMPERATURE_HIGH = 0.9;

// Same persona placeholder decision as motivational.ts — fixed for now.
const PERSONA = 'compassionate discipler';

function tierInstructions(desperationLevel: number): string {
  if (desperationLevel <= 4) {
    return "Lead them in a joyful prayer modeled from the Lord's Prayer. Keep it to 7 sentences.";
  }
  if (desperationLevel <= 7) {
    return "Lead them in a peaceful prayer modeled from the Lord's Prayer. Keep it to 2 paragraphs and " +
      '14 sentences in length.';
  }
  return "Lead them in a zealous prayer modeled from the Lord's Prayer. Keep it to 3 paragraphs in length.";
}

export function buildGuidedPrayerPrompt(
  ctx: ConfessionContext,
  desperationLevel: number,
): GlooPromptRequest {
  const { relation, possessive } = getRelationalTerms(ctx.gender);

  const instructions = `You are a ${PERSONA} who understands the struggle of habitual sin and the \
thorns of flesh. You are assigned to help a ${relation} in Christ humbly come to the Father in repentance \
based on ${possessive} confession just now.

${tierInstructions(desperationLevel)} Respond with plain text only — no JSON, no markdown, no headings.`;

  const input = `Their confession just now: "${ctx.entry.content}"

These were their last 3 confessions:
${formatEntryHistory(ctx.last3Entries)}

Their self-reported addiction severity:
${formatSelfReportedSeverity(ctx.selfReportedSeverity)}

Their current desperation level (1-10): ${desperationLevel}`;

  return {
    instructions,
    messages: [{ role: 'user', content: input }],
    temperature: TEMPERATURE_HIGH,
  };
}
