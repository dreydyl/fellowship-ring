// Shared React Query client instance.
//
// TODO: Configure default query options (staleTime, retry, etc.) as needed.

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();
