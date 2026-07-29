// Prompt builder for "Generate Motivational" (prompt #3).
//
// Endpoint: Completions V2 (callGlooCompletion). Temperature: medium.
// Expects plain text back (no JSON, no markdown) — a short affirmation
// and exhortation, capped at 4 sentences, matching the entry's length.

import type { ConfessionContext } from '../confessionContext.ts';
import type { GlooMessage } from '../glooClient.ts';
import { getRelationalTerms } from './pronouns.ts';
import { formatEntryHistory, formatSelfReportedSeverity } from './formatting.ts';

export interface GlooPromptRequest {
  instructions: string;
  messages: GlooMessage[];
  temperature: number;
}

const TEMPERATURE_MEDIUM = 0.6;

// Persona fixed to "discipler" for now — the original spec left this as
// a bracketed choice ([pastor|priest|youth pastor|discipler|father|
// mother|counselor|therapist]). Revisit if you want this configurable
// per-user (e.g. a profile preference) rather than a single default.
const PERSONA = 'compassionate discipler';

export function buildMotivationalPrompt(ctx: ConfessionContext): GlooPromptRequest {
  const { relation, possessive } = getRelationalTerms(ctx.gender);

  const instructions = `You are a ${PERSONA} who understands the struggle of habitual sin and the \
thorns of flesh. You are assigned to help a ${relation} in Christ humbly come to the Father in repentance \
based on ${possessive} confession just now.

Give them a quick affirmation and exhortation. Match the length of their entry (max 4 sentences). \
Respond with plain text only — no JSON, no markdown, no headings.`;

  const input = `Their confession just now: "${ctx.entry.content}"

These were their last 7 confessions:
${formatEntryHistory(ctx.last7Entries)}

Their self-reported addiction severity:
${formatSelfReportedSeverity(ctx.selfReportedSeverity)}`;

  return {
    instructions,
    messages: [{ role: 'user', content: input }],
    temperature: TEMPERATURE_MEDIUM,
  };
}
