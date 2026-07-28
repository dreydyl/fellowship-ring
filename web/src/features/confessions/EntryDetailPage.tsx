// Detail page for revisiting a single confession entry.
//
// TODO(Phase 2/3): render generated prayer / guidance once those
// edge functions and hooks exist. Reading plan generation is
// currently manually triggered; Phase 2 step 5 will wire it into the
// entry-save flow automatically.

import { Link, useParams } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useConfessionEntry } from './hooks/useConfessionEntry';
import { useReadingPlanForEntry } from '../guidance/hooks/useReadingPlanForEntry';
import { useGenerateReadingPlan } from '../guidance/hooks/useGenerateReadingPlan';
import { ReadingPlanCard } from '../guidance/ReadingPlanCard';

export function EntryDetailPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const { data: entry, isLoading, isError } = useConfessionEntry(entryId);
  const { data: readingPlan, isLoading: isLoadingReadingPlan } = useReadingPlanForEntry(entryId);
  const generateReadingPlan = useGenerateReadingPlan();

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/entries" className="text-sm text-indigo-600 hover:underline">
          ← Back to history
        </Link>

        {isLoading && <p className="mt-4 text-gray-500">Loading entry…</p>}
        {isError && <p className="mt-4 text-red-600">Failed to load entry.</p>}

        {entry && (
          <article className="mt-4">
            <p className="text-sm text-gray-500">
              {new Date(entry.created_at).toLocaleString()}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-gray-900">{entry.content}</p>
            <p className="mt-2 text-sm text-gray-500">Urge intensity: {entry.urge_intensity}/5</p>
          </article>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700">Reading Plan</h2>

          {isLoadingReadingPlan && <p className="mt-2 text-sm text-gray-500">Loading…</p>}

          {!isLoadingReadingPlan && readingPlan && (
            <div className="mt-2">
              <ReadingPlanCard plan={readingPlan} />
            </div>
          )}

          {!isLoadingReadingPlan && !readingPlan && entryId && (
            <button
              type="button"
              onClick={() => generateReadingPlan.mutate(entryId)}
              disabled={generateReadingPlan.isPending}
              className="mt-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {generateReadingPlan.isPending ? 'Generating…' : 'Generate reading plan'}
            </button>
          )}

          {generateReadingPlan.isError && (
            <p className="mt-2 text-sm text-red-600">
              {generateReadingPlan.error instanceof Error
                ? generateReadingPlan.error.message
                : 'Failed to generate reading plan.'}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
