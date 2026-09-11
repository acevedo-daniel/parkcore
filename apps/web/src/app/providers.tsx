import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, type RouterProviderProps } from 'react-router';

import { ToastProvider } from '../components/ui/feedback.js';
import { AuthProvider } from '../features/auth/auth-provider.js';
import { AppearanceProvider } from './appearance-provider.js';

const queryClient = new QueryClient();

export function AppProviders({ router }: Pick<RouterProviderProps, 'router'>) {
  return (
    <AppearanceProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppearanceProvider>
  );
}
