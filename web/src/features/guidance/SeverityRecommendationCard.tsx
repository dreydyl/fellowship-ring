// Accept/dismiss UI for the AI-recommended addiction severity level
// (recommend-severity, P5d). Accepting records an addiction_assessments
// row with source 'ai'; dismissing just hides the recommendation banner
// (see usePendingSeverityRecommendation) without recording anything —
// self-reporting a different number is handled separately on the
// Account page (useSubmitSelfReport). Either way, profiles.current_severity_level
// is kept in sync via useSubmitAssessment when the recommendation is accepted.
//
// If the recommendation matches what's already on the user's profile,
// there's nothing to accept/dismiss — the Accept/Dismiss options are
// replaced with a message saying so.

import { useSubmitAssessment } from '../assessment/hooks/useSubmitAssessment';
import { useProfile } from '../assessment/hooks/useProfile';

export function SeverityRecommendationCard({
  confessionEntryId,
  recommendedSeverity,
  onDismiss,
}: {
  confessionEntryId: string;
  recommendedSeverity: number;
  onDismiss: () => void;
}) {
  const submitAssessment = useSubmitAssessment();
  const { data: profile } = useProfile();

  if (submitAssessment.isSuccess) {
    const recorded = submitAssessment.data;
    return (
      <p className="mt-2 text-sm text-gray-700">
        Recorded severity level {recorded.severity_level}/5 (accepted AI recommendation).
      </p>
    );
  }

  const matchesCurrentProfile = profile?.current_severity_level === recommendedSeverity;

  if (matchesCurrentProfile) {
    return (
      <div className="mt-2">
        <p className="text-gray-900">Recommended severity: {recommendedSeverity}/5</p>
        <p className="mt-2 text-sm text-gray-700">
          This already matches your current profile — no change needed.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-gray-900">Recommended severity: {recommendedSeverity}/5</p>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() =>
            submitAssessment.mutate({
              severityLevel: recommendedSeverity,
              source: 'ai',
              basedOnEntryId: confessionEntryId,
            })
          }
          disabled={submitAssessment.isPending}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitAssessment.isPending ? 'Saving…' : 'Accept'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={submitAssessment.isPending}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>

      {submitAssessment.isError && (
        <p className="mt-2 text-sm text-red-600">
          {submitAssessment.error instanceof Error
            ? submitAssessment.error.message
            : 'Failed to record assessment.'}
        </p>
      )}
    </div>
  );
}
