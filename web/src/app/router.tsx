// Application route configuration using React Router.
//
// TODO: Add additional routes as new features are implemented.

import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { LoginPage } from '../features/auth/LoginPage';
import { HomePage } from '../features/dashboard/HomePage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { PpgPlotterPage } from '../features/ppg/PpgPlotterPage';
import { EntriesListPage } from '../features/confessions/EntriesListPage';
import { EntryDetailPage } from '../features/confessions/EntryDetailPage';
import { SelfReportPage } from '../features/assessment/SelfReportPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/account',
    element: (
      <ProtectedRoute>
        <div>
          {/* Placeholder stacking of the pre-existing pages; replaced by the
              real AccountPage in Prompt 7 (see docs/DESIGN.md section 7). */}
          <SettingsPage />
          <SelfReportPage />
        </div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: <Navigate to="/account" replace />,
  },
  {
    path: '/ppg',
    element: (
      <ProtectedRoute>
        <PpgPlotterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/entries',
    element: (
      <ProtectedRoute>
        <EntriesListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/entries/new',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/entries/:entryId',
    element: (
      <ProtectedRoute>
        <EntryDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/assessment',
    element: <Navigate to="/account" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
