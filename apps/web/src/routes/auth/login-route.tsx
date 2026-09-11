import { ArrowRight, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { AuthFormFrame, LoginFooter, LoginForm } from '../../features/auth/auth-forms.js';
import { DemoLoginButton } from '../../features/auth/demo-login-button.js';
import { useDocumentMeta } from '../../lib/document-meta.js';
import { getReturnTo } from './auth-redirect.js';
import { RedirectAuthenticated } from './auth-guard.js';

export function LoginRoute() {
  const { t } = useAppearance();
  useDocumentMeta({
    description: t('auth.login.metaDescription'),
    noIndex: true,
    title: t('auth.login.metaTitle'),
  });
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <RedirectAuthenticated>
      <AuthFormFrame
        eyebrow={t('auth.login.eyebrow')}
        footer={<LoginFooter />}
        title={t('auth.login.title')}
      >
        <div className="rounded-[1.75rem] bg-accent p-5 text-accent-foreground shadow-hover">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] uppercase">
            <Sparkles aria-hidden="true" className="size-4" />
            {t('auth.login.demoEyebrow')}
          </div>
          <h2 className="mt-3 font-display text-xl font-extrabold tracking-[-0.03em]">
            {t('auth.login.demoTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-accent-foreground/80">
            {t('auth.login.demoDescription')}
          </p>
          <DemoLoginButton
            onSuccess={() => {
              void navigate('/app', { replace: true });
            }}
            className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {t('auth.login.demoAction')}
            <ArrowRight aria-hidden="true" className="ml-2 inline size-4" />
          </DemoLoginButton>
        </div>
        <div className="mt-7 flex items-center gap-3 text-xs font-bold tracking-[0.1em] text-foreground-muted uppercase before:h-px before:flex-1 before:bg-border-subtle after:h-px after:flex-1 after:bg-border-subtle">
          {t('auth.login.emailDivider')}
        </div>
        <LoginForm
          onSuccess={() => {
            void navigate(getReturnTo(location.search), { replace: true });
          }}
        />
      </AuthFormFrame>
    </RedirectAuthenticated>
  );
}
