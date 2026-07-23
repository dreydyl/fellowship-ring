// Recovery dashboard: history of confessions + recent guidance.

import { Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useConfessionEntries } from '../confessions/hooks/useConfessionEntries';
import { useRecentGuidance } from './hooks/useRecentGuidance';

export function DashboardPage() {
  const { data: entries, isLoading: entriesLoading } = useConfessionEntries();
  const { data: guidance, isLoading: guidanceLoading } = useRecentGuidance();

  const recentEntries = entries?.slice(0, 5) ?? [];

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      <nav className="mt-4 flex gap-4 text-sm">
        <Link to="/entries/new" className="text-indigo-600 hover:underline">
          Write New Entry
        </Link>
        <Link to="/entries" className="text-indigo-600 hover:underline">
          View All Entries
        </Link>
        <Link to="/assessment" className="text-indigo-600 hover:underline">
          Self-Report Severity
        </Link>
      </nav>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Confessions</h2>
        {entriesLoading && <p className="mt-2 text-gray-500">Loading…</p>}
        {!entriesLoading && recentEntries.length === 0 && (
          <p className="mt-2 text-gray-500">No entries yet.</p>
        )}
        <ul className="mt-2 space-y-2">
          {recentEntries.map((entry) => (
            <li key={entry.id}>
              <Link
                to={`/entries/${entry.id}`}
                className="block rounded-md border border-gray-200 p-3 hover:bg-gray-50"
              >
                <p className="text-xs text-gray-500">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
                <p className="mt-1 line-clamp-1 text-gray-900">{entry.content}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Guidance</h2>
        {guidanceLoading && <p className="mt-2 text-gray-500">Loading…</p>}
        {!guidanceLoading && (guidance?.length ?? 0) === 0 && (
          <p className="mt-2 text-gray-500">
            No guidance yet. Guidance appears here after you write an entry.
          </p>
        )}
        <ul className="mt-2 space-y-2">
          {guidance?.map((record) => (
            <li key={record.id} className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-500">
                {new Date(record.created_at).toLocaleString()}
              </p>
              <p className="mt-1 text-gray-900">{record.content}</p>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </div>
  );
}
