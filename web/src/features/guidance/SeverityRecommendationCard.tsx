// Accept/edit UI for the AI-recommended addiction severity level
// (recommend-severity, P5d). Accepting records an addiction_assessments
// row with source 'ai'; submitting a different number instead records
// one with source 'self_report'. Either way, profiles.current_severity_level
// is kept in sync via useSubmitAssessment.

import { useState } from 'react';
import { useSubmitAssessment } from '../assessment/hooks/useSubmitAssessment';

function clampSeverity(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function SeverityRecommendationCard({
  confessionEntryId,
  recommendedSeverity,
}: {
  confessionEntryId: string;
  recommendedSeverity: number;
}) {
  const submitAssessment = useSubmitAssessment();
  const [isEditing, setIsEditing] = useState(false);
  const [ownSeverity, setOwnSeverity] = useState(recommendedSeverity);

  if (submitAssessment.isSuccess) {
    const recorded = submitAssessment.data;
    return (
      <p className="mt-2 text-sm text-gray-700">
        Recorded severity level {recorded.severity_level}/5
        {recorded.source === 'ai' ? ' (accepted AI recommendation).' : ' (your own report).'}
      </p>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-gray-900">Recommended severity: {recommendedSeverity}/5</p>

      {!isEditing && (
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
            onClick={() => setIsEditing(true)}
            disabled={submitAssessment.isPending}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Enter my own
          </button>
        </div>
      )}

      {isEditing && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitAssessment.mutate({
              severityLevel: clampSeverity(ownSeverity),
              source: 'self_report',
              basedOnEntryId: confessionEntryId,
            });
          }}
          className="mt-2 flex items-center gap-2"
        >
          <input
            type="number"
            min={1}
            max={5}
            value={ownSeverity}
            onChange={(event) => setOwnSeverity(Number(event.target.value))}
            className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={submitAssessment.isPending}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitAssessment.isPending ? 'Saving…' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={submitAssessment.isPending}
            className="text-sm text-gray-500 hover:underline"
          >
            Cancel
          </button>
        </form>
      )}

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
