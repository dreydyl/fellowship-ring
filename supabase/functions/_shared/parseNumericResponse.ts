// Shared helper for parsing Gloo AI responses that are expected to be
// a bare number (e.g. "7" or "3") within a known range. Used by the
// desperation and severity-recommendation edge functions.

export function parseNumericResponse(text: string, min: number, max: number): number {
  const match = text.trim().match(/-?\d+(\.\d+)?/);
  if (!match) {
    throw new Error(`Gloo AI response did not contain a number: ${text}`);
  }

  const value = Math.round(parseFloat(match[0]));
  if (value < min || value > max) {
    throw new Error(`Gloo AI response out of expected range [${min}-${max}]: ${text}`);
  }

  return value;
}
