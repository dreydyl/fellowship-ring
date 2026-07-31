// Prompt builder for "Generate Motivational" (prompt #3).
//
// Endpoint: Completions V2 (callGlooCompletion). Temperature: medium.
// Expects plain text back (no JSON, no markdown) — a short affirmation
// and exhortation, capped at 4 sentences, matching the entry's length.

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

const TEMPERATURE_MEDIUM = 0.6;

export function buildMotivationalPrompt(ctx: ConfessionContext): GlooPromptRequest {
  const { relation, possessive } = getRelationalTerms(ctx.gender);

  const instructions = `Context: this is a private, moderated Christian recovery-journaling app for \
overcoming pornography addiction. References below to "struggle," "urge," "relapse," "temptation," or \
self-critical language refer to compulsive/addictive behavior patterns and spiritual struggle — not \
self-harm or suicidal ideation.

${PERSONA_DESCRIPTION}

You understand the struggle of habitual sin and the thorns of flesh, and are helping a ${relation} in \
Christ humbly come to the Father in repentance based on ${possessive} confession just now.

Give them a quick affirmation and exhortation. Match the length of their entry (max 4 sentences). \
Respond with plain text only — no JSON, no markdown, no headings.`;

  const input = `Their confession just now: "${ctx.entry.content}"

These were their last 7 confessions:
${formatEntryHistory(ctx.last7Entries)}

Their current addiction severity:
${formatAddictionSeverity(ctx.addictionSeverity)}`;

  return {
    instructions,
    messages: [{ role: 'user', content: input }],
    temperature: TEMPERATURE_MEDIUM,
  };
}
