// Basic card displaying the AI-suggested reading plan for a
// confession entry, using the official YouVersion Platform SDK's
// BibleCard component to render verse text.

import { BibleCard } from '@youversion/platform-react-ui';
import { toUsfmReference } from './utils/bibleReference';
import type { ReadingPlan } from './hooks/useReadingPlanForEntry';

const DEFAULT_VERSION_ID = 111; // NIV

interface ReadingPlanCardProps {
  plan: ReadingPlan;
}

export function ReadingPlanCard({ plan }: ReadingPlanCardProps) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{plan.title}</h3>
      {plan.description && <p className="mt-1 text-sm text-gray-600">{plan.description}</p>}
      <ul className="mt-3 space-y-3">
        {plan.plan_json.passages
          .slice()
          .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
          .map((passage) => {
            const usfmReference = toUsfmReference(passage.reference);

            return (
              <li key={passage.reference} className="rounded-md bg-gray-50 p-3">
                <p className="text-sm font-medium text-indigo-700">{passage.reference}</p>
                {passage.summary && (
                  <p className="mt-1 text-sm text-gray-600">{passage.summary}</p>
                )}
                {usfmReference ? (
                  <div className="mt-2">
                    <BibleCard reference={usfmReference} versionId={DEFAULT_VERSION_ID} />
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-red-600">Unable to display this reference.</p>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
