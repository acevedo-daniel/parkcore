import { useLocation, useNavigate } from 'react-router';

import { AuthFormFrame, RegisterFooter, RegisterForm } from '../../features/auth/auth-forms.js';
import { getReturnTo } from './auth-redirect.js';
import { RedirectAuthenticated } from './auth-guard.js';

export function RegisterRoute() {
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
