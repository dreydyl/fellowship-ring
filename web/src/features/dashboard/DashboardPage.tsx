// Placeholder dashboard page.
//
// TODO: Implement dashboard UI: device status, recent PPG sessions,
// and summary visualizations.

import { Link } from 'react-router-dom';

export function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>
        <Link to="/ppg">Open PPG Plotter</Link>
      </p>
      {/* TODO: Render dashboard widgets. */}
    </div>
  );
}
