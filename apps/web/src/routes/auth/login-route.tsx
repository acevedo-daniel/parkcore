import { useNavigate, useLocation } from 'react-router';

import { AuthFormFrame, LoginFooter, LoginForm } from '../../features/auth/auth-forms.js';
import { getReturnTo } from './auth-redirect.js';
import { RedirectAuthenticated } from './auth-guard.js';

export function LoginRoute() {
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
