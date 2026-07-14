// Application route configuration using React Router.
//
// TODO: Add route guards for authenticated routes.
// TODO: Add additional routes as new features are implemented.

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { SettingsPage } from '../features/settings/SettingsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  // TODO: Add routes for the `ppg` feature (data visualization).
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
