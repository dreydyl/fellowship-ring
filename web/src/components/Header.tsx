// Shared site header rendered on every page. Links back to the homepage.

import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center px-4 py-4">
        <Link to="/" className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
          FellowshipRing
        </Link>
      </div>
    </header>
  );
}
