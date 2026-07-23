// Page for writing a new confession entry.

import { Link } from 'react-router-dom';
import { NewEntryForm } from './NewEntryForm';

export function NewEntryPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">New Entry</h1>
        <Link to="/entries" className="text-sm text-indigo-600 hover:underline">
          View history
        </Link>
      </div>
      <NewEntryForm />
    </div>
  );
}
