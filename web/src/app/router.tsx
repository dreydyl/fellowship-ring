// Application route configuration using React Router.
//
// TODO: Add additional routes as new features are implemented.

import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { LoginPage } from '../features/auth/LoginPage';
import { HomePage } from '../features/dashboard/HomePage';
import { AccountPage } from '../features/account/AccountPage';
import { PpgPlotterPage } from '../features/ppg/PpgPlotterPage';
import { EntriesListPage } from '../features/confessions/EntriesListPage';
import { EntryDetailPage } from '../features/confessions/EntryDetailPage';
import { ScrollToTop } from './ScrollToTop';

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

// Root layout mounted once for every route. Renders ScrollToTop (which
// reacts to useLocation() and needs to live inside the router context)
// alongside the matched route's element via <Outlet/>.
function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
            <AccountPage />
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
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
