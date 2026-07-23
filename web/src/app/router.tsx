// Application route configuration using React Router.
//
// TODO: Add additional routes as new features are implemented.

import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { PpgPlotterPage } from '../features/ppg/PpgPlotterPage';
import { NewEntryPage } from '../features/confessions/NewEntryPage';
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
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
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
    element: (
      <ProtectedRoute>
        <NewEntryPage />
      </ProtectedRoute>
    ),
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
    element: (
      <ProtectedRoute>
        <SelfReportPage />
      </ProtectedRoute>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
