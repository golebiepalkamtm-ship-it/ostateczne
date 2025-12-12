'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { useState } from 'react';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthErrorBanner />
        {children}
        <div suppressHydrationWarning>
          <ReactQueryDevtools initialIsOpen={false} />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Default export dla lepszej kompatybilności z Fast Refresh
export default ClientProviders;
