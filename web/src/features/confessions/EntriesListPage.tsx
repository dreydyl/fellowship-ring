// History of confession entries, most recent first.

import { Link } from 'react-router-dom';
import { useConfessionEntries } from './hooks/useConfessionEntries';

export function EntriesListPage() {
  const { data: entries, isLoading, isError } = useConfessionEntries();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Your Entries</h1>
        <Link
          to="/entries/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          Write New Entry
        </Link>
      </div>

      {isLoading && <p className="text-gray-500">Loading entries…</p>}
      {isError && <p className="text-red-600">Failed to load entries.</p>}

      {entries && entries.length === 0 && (
        <p className="text-gray-500">
          No entries yet. <Link to="/entries/new" className="text-indigo-600 hover:underline">
            Write your first one.
          </Link>
        </p>
      )}

      <ul className="space-y-3">
        {entries?.map((entry) => (
          <li key={entry.id}>
            <Link
              to={`/entries/${entry.id}`}
              className="block rounded-md border border-gray-200 p-4 hover:bg-gray-50"
            >
              <p className="text-sm text-gray-500">
                {new Date(entry.created_at).toLocaleString()}
              </p>
              <p className="mt-1 line-clamp-2 text-gray-900">{entry.content}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
