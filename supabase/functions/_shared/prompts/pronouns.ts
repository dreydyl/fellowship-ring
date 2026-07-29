// Shared helper for mapping a confession context's gender into the
// relational term and pronouns used across the Gloo AI prompt
// builders (e.g. "brother"/"sister", "his"/"her").

import type { ConfessionContext } from '../confessionContext.ts';

export interface RelationalTerms {
  relation: string; // "brother" | "sister" | "brother or sister"
  subject: string; // "he" | "she" | "they"
  object: string; // "him" | "her" | "them"
  possessive: string; // "his" | "her" | "their"
}

/**
 * Falls back to gender-neutral plural terms when the user hasn't set a
 * gender on their profile.
 */
export function getRelationalTerms(gender: ConfessionContext['gender']): RelationalTerms {
  if (gender === 'brother') {
    return { relation: 'brother', subject: 'he', object: 'him', possessive: 'his' };
  }
  if (gender === 'sister') {
    return { relation: 'sister', subject: 'she', object: 'her', possessive: 'her' };
  }
  return { relation: 'brother or sister', subject: 'they', object: 'them', possessive: 'their' };
}
