import { useLocation, useNavigate } from 'react-router';

import { AuthFormFrame, RegisterFooter, RegisterForm } from '../../features/auth/auth-forms.js';
import { getReturnTo } from './auth-redirect.js';
import { RedirectAuthenticated } from './auth-guard.js';
import { useDocumentMeta } from '../../lib/document-meta.js';

export function RegisterRoute() {
  useDocumentMeta({
    description: 'Create a ParkCore owner account to operate parking facilities.',
    title: 'Create account | ParkCore',
  });
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <RedirectAuthenticated>
      <AuthFormFrame eyebrow="Owner access" footer={<RegisterFooter />} title="Create account.">
        <RegisterForm
          onSuccess={() => {
            void navigate(getReturnTo(location.search), { replace: true });
          }}
        />
      </AuthFormFrame>
    </RedirectAuthenticated>
  );
}
