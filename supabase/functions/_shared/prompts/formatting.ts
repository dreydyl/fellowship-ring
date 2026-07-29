// Shared formatting helpers for turning ConfessionContext pieces into
// the plain-text blocks embedded in Gloo AI prompts.

import type { ConfessionEntrySummary, ConfessionContext } from '../confessionContext.ts';

export function formatEntryHistory(entries: ConfessionEntrySummary[]): string {
  if (!entries.length) return 'No prior confessions on record.';

  return entries
    .map(
      (entry, index) =>
        `${index + 1}. [${entry.createdAt}] (urge intensity: ${entry.urgeIntensity}) ${entry.content}`,
    )
    .join('\n');
}

export function formatSelfReportedSeverity(
  severity: ConfessionContext['selfReportedSeverity'],
): string {
  if (!severity) return 'Not yet self-reported.';
  return `${severity.level} (self-reported since ${severity.since})`;
}
