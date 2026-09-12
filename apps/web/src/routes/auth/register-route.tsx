import { useLocation, useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { AuthFormFrame, RegisterFooter, RegisterForm } from '../../features/auth/auth-forms.js';
import { getAuthPath, getReturnTo } from './auth-redirect.js';
import { RedirectAuthenticated } from './auth-guard.js';
import { useDocumentMeta } from '../../lib/document-meta.js';

export function RegisterRoute() {
  const { t } = useAppearance();
  useDocumentMeta({
    description: t('auth.register.metaDescription'),
    noIndex: true,
    title: t('auth.register.metaTitle'),
  });
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = getReturnTo(location.search);

  return (
    <RedirectAuthenticated>
      <AuthFormFrame
        eyebrow={t('auth.register.eyebrow')}
        footer={<RegisterFooter loginHref={getAuthPath('/login', returnTo)} />}
        title={t('auth.register.title')}
      >
        <RegisterForm
          onSuccess={() => {
            void navigate(returnTo, { replace: true });
          }}
        />
      </AuthFormFrame>
    </RedirectAuthenticated>
  );
}
