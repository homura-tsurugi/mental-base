'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5分
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // テーマの初期化
  useEffect(() => {
    const theme = localStorage.getItem('mental-base-theme');
    if (theme) {
      try {
        const { state } = JSON.parse(theme);
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      } catch (e) {
        console.error('Failed to parse theme:', e);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
