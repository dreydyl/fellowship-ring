// Shared formatting helpers for turning ConfessionContext pieces into
// the plain-text blocks embedded in Gloo AI prompts.

import type { ConfessionEntrySummary, ConfessionContext } from '../confessionContext.ts';

export function formatEntryHistory(entries: ConfessionEntrySummary[]): string {
  // Entries with desperationLevel === 0 were determined to have
  // nothing to do with confession/recovery (see assess-desperation /
  // generate-entry-guidance) — leave them out of the history so they
  // don't get treated as real prior confessions in later prompts.
  const relevantEntries = entries.filter((entry) => entry.desperationLevel !== 0);
  if (!relevantEntries.length) return 'No prior confessions on record.';

  return relevantEntries
    .map(
      (entry, index) =>
        `${index + 1}. [${entry.createdAt}] (urge intensity: ${entry.urgeIntensity}) ${entry.content}`,
    )
    .join('\n');
}

export function formatAddictionSeverity(
  severity: ConfessionContext['addictionSeverity'],
): string {
  if (!severity) return 'Not yet assessed.';
  const sourceLabel = severity.source === 'ai' ? 'AI-recommended, accepted' : 'self-reported';
  return `${severity.level} (${sourceLabel} since ${severity.since})`;
}
