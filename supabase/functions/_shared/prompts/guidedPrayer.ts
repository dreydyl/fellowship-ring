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
import { formatEntryHistory, formatAddictionSeverity } from './formatting.ts';
import { PERSONA_DESCRIPTION } from './persona.ts';

export interface GlooPromptRequest {
  instructions: string;
  messages: GlooMessage[];
  temperature: number;
}

const TEMPERATURE_HIGH = 0.9;

function tierInstructions(desperationLevel: number): string {
  if (desperationLevel <= 4) {
    return "Lead them in a joyful prayer modeled from the Lord's Prayer inspired by Psalm 32. Keep it to 7 sentences.";
  }
  if (desperationLevel <= 7) {
    return "Lead them in a peaceful prayer modeled from the Lord's Prayer inspired by Psalm 143. Keep it to 2 paragraphs and 14 sentences in length.";
  }
  return "Lead them in a zealous prayer modeled from Psalm 51 with the heart of Lord's Prayer. Keep it to 3 paragraphs in length.";
}

export function buildGuidedPrayerPrompt(
  ctx: ConfessionContext,
  desperationLevel: number,
): GlooPromptRequest {
  const { relation, possessive } = getRelationalTerms(ctx.gender);

  const instructions = `${PERSONA_DESCRIPTION}

You understand the struggle of habitual sin and the thorns of flesh, and are helping a ${relation} in \
Christ humbly come to the Father in repentance based on ${possessive} confession just now.

${tierInstructions(desperationLevel)} Let it be in first person as if the user is praying. Respond with plain text only — no JSON, no markdown, no headings.`;

  const input = `Their confession just now: "${ctx.entry.content}"

These were their last 3 confessions:
${formatEntryHistory(ctx.last3Entries)}

Their current addiction severity:
${formatAddictionSeverity(ctx.addictionSeverity)}`;

  return {
    instructions,
    messages: [{ role: 'user', content: input }],
    temperature: TEMPERATURE_HIGH,
  };
}
