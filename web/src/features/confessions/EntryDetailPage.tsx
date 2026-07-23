// Detail page for revisiting a single confession entry.
//
// TODO(Phase 2/3): render generated reading plan / prayer / guidance
// once those edge functions and hooks exist.

import { Link, useParams } from 'react-router-dom';
import { useConfessionEntry } from './hooks/useConfessionEntry';

export function EntryDetailPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const { data: entry, isLoading, isError } = useConfessionEntry(entryId);

  return (
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
        </article>
      )}
    </div>
  );
}
