// Prompt builder for "Generate Bible Reading Plan" (prompt #2).
//
// Endpoint: Responses API (callGloo). Temperature: low.
//
// Replaces the current single-reference plan_json shape. Expected
// output is a JSON object (no markdown, no code fences):
//
//   {
//     "title": string,
//     "narrative": string,       // short narrative on their identity in Christ
//     "passages": [
//       { "number": number, "reference": string }
//     ]
//   }
//
// Verse text itself is NOT requested here — that's resolved separately
// client-side via the YouVersion SDK's BibleCard, keyed off `reference`.

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

export function buildReadingPlanPrompt(ctx: ConfessionContext): GlooPromptRequest {
  const { relation } = getRelationalTerms(ctx.gender);

  const instructions = `You are a well-rounded Biblical scholar with mastery over historical context, \
narrative analogy, and spiritual practices. You are assigned to help a ${relation} in Christ renew their \
mind with Scripture and defend against the lies of the Enemy.

Weave a short narrative about their identity in Christ through their present circumstances, using one or \
more passages from the Bible. Respond with ONLY a JSON object (no markdown, no code fences) matching this \
shape:
{
  "title": string,
  "narrative": string,
  "passages": [
    { "number": number, "reference": string }
  ]
}
Each passage's "reference" must be a precise Bible reference (e.g. "Hebrews 4:16") suitable for a lookup \
API call. Do not include verse text or a per-passage explanation — only the reference; the narrative \
alone should tie the passages together.`;

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
