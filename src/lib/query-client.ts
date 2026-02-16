import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: How long data is considered "fresh"
        staleTime: 5 * 60 * 1000, // 5 minutes

        // GC time: How long unused data stays in cache (formerly cacheTime)
        gcTime: 10 * 60 * 1000, // 10 minutes

        // Retry failed requests once
        retry: 1,

        // Refetch strategies
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,

        // No automatic interval refetching
        refetchInterval: false,
      },
      mutations: {
        // Don't retry mutations automatically (data integrity)
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
