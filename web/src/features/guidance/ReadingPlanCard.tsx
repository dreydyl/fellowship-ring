// Basic card displaying the AI-suggested reading plan for a
// confession entry. Shows passage reference only for now — verse
// text will be fetched via the YouVersion proxy in a later step.

import type { ReadingPlan } from './hooks/useReadingPlanForEntry';

interface ReadingPlanCardProps {
  plan: ReadingPlan;
}

export function ReadingPlanCard({ plan }: ReadingPlanCardProps) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{plan.title}</h3>
      {plan.description && <p className="mt-1 text-sm text-gray-600">{plan.description}</p>}
      <ul className="mt-3 space-y-1">
        {plan.plan_json.passages.map((passage) => (
          <li key={passage.reference} className="text-sm font-medium text-indigo-700">
            {passage.reference}
          </li>
        ))}
      </ul>
    </div>
  );
}
