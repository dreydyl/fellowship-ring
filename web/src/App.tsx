// Root application component. Wires together global providers
// (React Query, Auth) and the router.
//
// TODO: Add additional global providers (theme, error boundary, etc.) as needed.

import { QueryClientProvider } from '@tanstack/react-query';
import { YouVersionProvider } from '@youversion/platform-react-ui';
import { queryClient } from './app/queryClient';
import { AuthProvider } from './features/auth/AuthProvider';
import { AppRouter } from './app/router';

const youVersionAppKey = import.meta.env.VITE_YOUVERSION_APP_KEY as string;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YouVersionProvider appKey={youVersionAppKey} theme="light" includeAuth={false}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </YouVersionProvider>
    </QueryClientProvider>
  );
}

export default App;
