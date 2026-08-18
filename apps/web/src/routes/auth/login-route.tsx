import { useNavigate, useLocation } from 'react-router';

import { AuthFormFrame, LoginFooter, LoginForm } from '../../features/auth/auth-forms.js';
import { getReturnTo } from './auth-redirect.js';
import { RedirectAuthenticated } from './auth-guard.js';
import { useDocumentMeta } from '../../lib/document-meta.js';

export function LoginRoute() {
  useDocumentMeta({
    description: 'Sign in to operate your ParkCore parking facilities.',
    noIndex: true,
    title: 'Sign in | ParkCore',
  });
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <RedirectAuthenticated>
      <AuthFormFrame eyebrow="Owner access" footer={<LoginFooter />} title="Sign in.">
        <LoginForm
          onSuccess={() => {
            void navigate(getReturnTo(location.search), { replace: true });
          }}
        />
      </AuthFormFrame>
    </RedirectAuthenticated>
  );
}
