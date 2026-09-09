import { ArrowRight, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { AuthFormFrame, LoginFooter, LoginForm } from '../../features/auth/auth-forms.js';
import { DemoLoginButton } from '../../features/auth/demo-login-button.js';
import { useDocumentMeta } from '../../lib/document-meta.js';
import { getReturnTo } from './auth-redirect.js';
import { RedirectAuthenticated } from './auth-guard.js';

export function LoginRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  useDocumentMeta({
    description: es
      ? 'Ingresá a ParkCore o recorré la demo de operador.'
      : 'Sign in to operate your ParkCore parking facilities.',
    noIndex: true,
    title: es ? 'Ingresar | ParkCore' : 'Sign in | ParkCore',
  });
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <RedirectAuthenticated>
      <AuthFormFrame
        eyebrow={es ? 'Acceso para operadores' : 'Operator access'}
        footer={<LoginFooter />}
        title={es ? 'Volvé a tu cochera.' : 'Return to your facility.'}
      >
        <div className="rounded-[1.75rem] bg-[#ffcc00] p-5 text-[#121417] shadow-[0_5px_0_#121417]">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] uppercase">
            <Sparkles aria-hidden="true" className="size-4" />
            {es ? 'Para recorrer ParkCore' : 'To explore ParkCore'}
          </div>
          <h2 className="mt-3 font-display text-xl font-extrabold tracking-[-0.03em]">
            {es ? 'Entrá a la demo sin contraseña.' : 'Enter the demo without a password.'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#344034]">
            {es
              ? 'Conocé una jornada de ejemplo con cocheras, ingresos y salidas ya preparadas.'
              : 'Walk through an example day with facilities, arrivals, and departures already prepared.'}
          </p>
          <DemoLoginButton
            onSuccess={() => {
              void navigate('/app', { replace: true });
            }}
            className="mt-5 w-full rounded-full bg-[#121417] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#121417]"
          >
            {es ? 'Entrar a la demo' : 'Enter the demo'}
            <ArrowRight aria-hidden="true" className="ml-2 inline size-4" />
          </DemoLoginButton>
        </div>
        <div className="mt-7 flex items-center gap-3 text-xs font-bold tracking-[0.1em] text-[#748074] uppercase before:h-px before:flex-1 before:bg-[#1d241f]/10 after:h-px after:flex-1 after:bg-[#1d241f]/10">
          {es ? 'o ingresá con email' : 'or sign in with email'}
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
