// Root application component. Wires together global providers
// (React Query, Auth) and the router.
//
// TODO: Add additional global providers (theme, error boundary, etc.) as needed.

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './app/queryClient';
import { AuthProvider } from './features/auth/AuthProvider';
import { AppRouter } from './app/router';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
