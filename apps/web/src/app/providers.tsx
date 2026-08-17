import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, type RouterProviderProps } from 'react-router';

import { ToastProvider } from '../components/ui/feedback.js';
import { AuthProvider } from '../features/auth/auth-provider.js';

const queryClient = new QueryClient();

export function AppProviders({ router }: Pick<RouterProviderProps, 'router'>) {
  return (
    <AuthProvider>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
