import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, type RouterProviderProps } from 'react-router';

import { Toaster } from '../components/ui/sonner.js';
import { AuthProvider } from '../features/auth/auth-provider.js';
import { AppearanceProvider, useAppearance } from './appearance-provider.js';
import { useDocumentReadyMarker } from './document-ready.js';

const queryClient = new QueryClient();

export function AppProviders({ router }: Pick<RouterProviderProps, 'router'>) {
  useDocumentReadyMarker();

  return (
    <AppearanceProvider>
      <AppToaster />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </AppearanceProvider>
  );
}

function AppToaster() {
  const { t, theme } = useAppearance();
  const bottomOffset = 'calc(4rem + env(safe-area-inset-bottom, 0px) + 3rem)';

  return (
    <Toaster
      containerAriaLabel={t('feedback.toastRegion')}
      mobileOffset={{ bottom: bottomOffset }}
      offset={{ bottom: bottomOffset }}
      position="bottom-right"
      theme={theme}
    />
  );
}
