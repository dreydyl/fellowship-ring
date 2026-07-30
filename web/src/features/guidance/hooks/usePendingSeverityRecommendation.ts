// Client-only cache slot (React Query cache, NOT Supabase or
// localStorage) for an AI severity recommendation that hasn't been
// accepted or dismissed yet.
//
// Populated by useEntryGuidanceOrchestrator the moment recommend-severity
// resolves, and cleared by EntryDetailPage when the user dismisses it
// (see SeverityRecommendationCard's onDismiss). Accepting it doesn't
// need to clear it explicitly — once addiction_assessments has a row
// for the entry, useAssessmentForEntry takes priority over this and the
// stale cache entry is simply never read again.
//
// Deliberately kept ephemeral rather than persisted server-side: it
// only needs to survive in-app navigation for the current browser tab
// (e.g. leaving the entry and coming back while it's still the most
// recent one), not page reloads, other tabs, or other devices. See the
// "What must I consider..." note in chat for the tradeoffs this implies.
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface PendingSeverityRecommendation {
  recommendedSeverity: number;
}

export function pendingSeverityRecommendationKey(confessionEntryId: string) {
  return ['pending-severity-recommendation', confessionEntryId] as const;
}

export function usePendingSeverityRecommendation(confessionEntryId: string | undefined) {
  const queryClient = useQueryClient();

  const { data } = useQuery<PendingSeverityRecommendation | undefined>({
    queryKey: pendingSeverityRecommendationKey(confessionEntryId ?? ''),
    queryFn: () => undefined,
    enabled: false,
    staleTime: Infinity,
  });

  const clear = () => {
    if (!confessionEntryId) return;
    queryClient.removeQueries({ queryKey: pendingSeverityRecommendationKey(confessionEntryId) });
  };

  return { data: confessionEntryId ? data : undefined, clear };
}
