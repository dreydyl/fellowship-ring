// Fallback copy surfaced to the client when assess-desperation
// determines an entry has nothing to do with confession or recovery
// (desperationLevel === 0). generate-entry-guidance skips every
// downstream Gloo AI task in that case rather than reinterpreting or
// forcing unrelated text into the confession workflow, and sends this
// message back instead so the client can fail gracefully.
//
// Kept deliberately non-judgmental: it states why nothing was
// generated, reminds the user what the journal is for, and invites a
// relevant entry, without assuming bad intent or revealing classifier
// confidence.

export const DISREGARDED_MESSAGE =
  "This entry doesn't appear to be a confession or journal entry related to pornography recovery. " +
  'Please write about a recent struggle, temptation, relapse, victory, or recovery experience.';

// Gloo AI's Completions V2 "governed path" runs automatic input
// guardrails with no configuration surface (per Gloo docs). When they
// trip, the model's actual response is replaced with a fixed generic
// crisis-resources template that ignores our `instructions` entirely.
// Detect that pattern so we don't store/display it as if it were a
// real affirmation or prayer.
const CRISIS_GUARDRAIL_MARKERS = [
  'crisis counselor',
  'which country are you in',
  'help is available',
] as const;

export function isCrisisGuardrailResponse(content: string): boolean {
  const normalized = content.toLowerCase();
  return CRISIS_GUARDRAIL_MARKERS.some((marker) => normalized.includes(marker));
}

// Default affirmation swapped in when the guardrail above fires,
// standing in for the motivational prompt's own request (see
// buildMotivationalPrompt in prompts/motivational.ts): a quick
// affirmation and exhortation, matching its persona and length cap,
// that stays true to the moment without depending on the model
// actually having engaged with the entry's specifics.
export const CRISIS_MESSAGE =
  "Whatever happened today, God's grace toward you hasn't changed — He already knows, and He " +
  "still calls you His own. Don't let shame talk you into hiding or giving up on this fight. " +
  'Bring it honestly to Him right now, get back up, and keep walking toward Him one step at a time.';
