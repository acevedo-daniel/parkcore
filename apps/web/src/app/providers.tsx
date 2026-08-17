import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, type RouterProviderProps } from 'react-router';

import { ToastProvider } from '../components/ui/feedback.js';

const queryClient = new QueryClient();

export function AppProviders({ router }: Pick<RouterProviderProps, 'router'>) {
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ToastProvider>
  );
}
