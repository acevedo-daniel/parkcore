import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { useEffect, useMemo, type ReactNode } from 'react';
import { z } from 'zod';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { Field, Input } from '../../components/ui/field.js';
import { localizeApiError } from '../../lib/api/api-error.js';
import type { Translator } from '../../lib/localization.js';
import { useAuth } from './use-auth.js';

function createLoginSchema(t: Translator) {
  return z.object({
    email: z
      .string()
      .trim()
      .pipe(z.email(t('validation.email'))),
    password: z
      .string()
      .min(8, t('validation.passwordMin', { count: 8 }))
      .max(100, t('validation.passwordMax', { count: 100 })),
  });
}

function createRegisterSchema(t: Translator) {
  return createLoginSchema(t).extend({
    name: z
      .string()
      .trim()
      .min(2, t('validation.firstNameMin', { count: 2 }))
      .max(50, t('validation.firstNameMax', { count: 50 })),
    lastName: z
      .string()
      .trim()
      .min(2, t('validation.lastNameMin', { count: 2 }))
      .max(50, t('validation.lastNameMax', { count: 50 })),
  });
}

type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export function AuthFormFrame({
  children,
  footer,
  eyebrow,
  title,
}: {
  children: ReactNode;
  footer: ReactNode;
  eyebrow: string;
  title: string;
}) {
  const { t } = useAppearance();
  return (
    <section aria-labelledby="auth-title" className="min-h-full bg-white py-12 sm:py-20">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-stretch lg:px-8">
        <div className="hidden rounded-[3rem_3rem_7rem_3rem] bg-[#121417] p-10 text-white shadow-[0_12px_0_rgba(18,20,23,0.15)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link
              className="inline-flex items-center gap-2 font-display text-xl font-black tracking-tight text-white"
              to="/"
            >
              PARKCORE
            </Link>
            <p className="mt-16 text-xs font-bold tracking-[0.12em] text-[#ffcc00] uppercase">
              {eyebrow}
            </p>
            <p
              aria-hidden="true"
              className="mt-5 font-display text-4xl font-black leading-[1.02] tracking-[-0.05em]"
            >
              {t('auth.frame.headline')}
            </p>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-[#f5f5f5]">
              {t('auth.frame.description')}
            </p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#d4d4d4]">
            {t('auth.frame.footer')}
          </p>
        </div>
        <div className="rounded-[2rem_2rem_4.5rem_2rem] border border-[#121417]/10 bg-white p-6 shadow-[0_10px_0_rgba(18,20,23,0.08)] sm:p-8 lg:p-10">
          <div>
            <Link
              className="inline-flex items-center gap-2 font-display text-lg font-black tracking-tight text-[#1d241f] lg:hidden"
              to="/"
            >
              PARKCORE
            </Link>
            <p className="mt-10 text-xs font-bold tracking-[0.12em] text-[#121417] uppercase lg:mt-0">
              {eyebrow}
            </p>
            <h1
              className="mt-3 font-display text-3xl font-black tracking-[-0.04em] text-[#1d241f] lg:text-4xl"
              id="auth-title"
            >
              {title}
            </h1>
          </div>
          <div className="mt-8 [&_.auth-form]:mt-6 [&_.auth-form]:flex [&_.auth-form]:flex-col [&_.auth-form]:gap-4 [&_.field]:space-y-1.5 [&_.field-label]:block [&_.field-label]:text-xs [&_.field-label]:font-bold [&_.field-label]:text-[#121417] [&_.control]:h-12 [&_.control]:w-full [&_.control]:rounded-2xl [&_.control]:border [&_.control]:border-[#121417]/10 [&_.control]:bg-[#f5f5f5] [&_.control]:px-4 [&_.control]:text-sm [&_.control]:font-medium [&_.control]:text-[#121417] [&_.control]:outline-none [&_.control]:transition-colors [&_.control]:focus:border-[#121417] [&_.control]:focus:bg-white [&_.form-error]:text-sm [&_.form-error]:font-medium [&_.form-error]:text-[#b42318]">
            {children}
          </div>
          <p className="mt-6 border-t border-[#1d241f]/10 pt-5 text-sm leading-relaxed text-[#526052]">
            {footer}
          </p>
        </div>
      </div>
    </section>
  );
}

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useAppearance();
  const { login } = useAuth();
  const resolver = useMemo(() => zodResolver(createLoginSchema(t)), [t]);
  const form = useForm<LoginValues>({
    defaultValues: { email: '', password: '' },
    resolver,
  });
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) void form.trigger();
  }, [form, t]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await login(values);
      onSuccess();
    } catch (error) {
      form.setError('root', {
        message: localizeApiError(error, t, 'auth.loginError', {
          401: 'auth.invalidCredentials',
          429: 'auth.rateLimited',
        }),
      });
    }
  });

  return (
    <form
      className="auth-form"
      noValidate
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <Field
        error={form.formState.errors.email?.message}
        htmlFor="email"
        label={t('auth.fields.email')}
      >
        <Input
          autoComplete="email"
          autoFocus
          id="email"
          inputMode="email"
          type="email"
          {...form.register('email')}
        />
      </Field>
      <Field
        error={form.formState.errors.password?.message}
        htmlFor="password"
        label={t('auth.fields.password')}
      >
        <Input
          autoComplete="current-password"
          id="password"
          type="password"
          {...form.register('password')}
        />
      </Field>
      {form.formState.errors.root?.message ? (
        <p className="form-error" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button
        className="h-12 rounded-full bg-[#121417] text-white hover:bg-[#ffcc00] hover:text-[#121417]"
        disabled={form.formState.isSubmitting}
        fullWidth
        type="submit"
      >
        {form.formState.isSubmitting ? t('auth.actions.signingIn') : t('auth.actions.signIn')}
      </Button>
    </form>
  );
}

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useAppearance();
  const { register: registerUser } = useAuth();
  const resolver = useMemo(() => zodResolver(createRegisterSchema(t)), [t]);
  const form = useForm<RegisterValues>({
    defaultValues: { email: '', lastName: '', name: '', password: '' },
    resolver,
  });
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) void form.trigger();
  }, [form, t]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await registerUser({
        email: values.email,
        lastName: values.lastName,
        name: values.name,
        password: values.password,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      onSuccess();
    } catch (error) {
      form.setError('root', {
        message: localizeApiError(error, t, 'auth.registerError', {
          409: 'auth.emailTaken',
          429: 'auth.rateLimited',
        }),
      });
    }
  });

  return (
    <form
      className="auth-form"
      noValidate
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <Field
        error={form.formState.errors.name?.message}
        htmlFor="name"
        label={t('auth.fields.firstName')}
      >
        <Input autoComplete="name" autoFocus id="name" {...form.register('name')} />
      </Field>
      <Field
        error={form.formState.errors.lastName?.message}
        htmlFor="lastName"
        label={t('auth.fields.lastName')}
      >
        <Input autoComplete="family-name" id="lastName" {...form.register('lastName')} />
      </Field>
      <Field
        error={form.formState.errors.email?.message}
        htmlFor="email"
        label={t('auth.fields.email')}
      >
        <Input
          autoComplete="email"
          id="email"
          inputMode="email"
          type="email"
          {...form.register('email')}
        />
      </Field>
      <Field
        error={form.formState.errors.password?.message}
        htmlFor="password"
        label={t('auth.fields.password')}
      >
        <Input
          autoComplete="new-password"
          id="password"
          type="password"
          {...form.register('password')}
        />
      </Field>
      {form.formState.errors.root?.message ? (
        <p className="form-error" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button
        className="h-12 rounded-full bg-[#121417] text-white hover:bg-[#ffcc00] hover:text-[#121417]"
        disabled={form.formState.isSubmitting}
        fullWidth
        type="submit"
      >
        {form.formState.isSubmitting
          ? t('auth.actions.creatingAccount')
          : t('auth.actions.createAccount')}
      </Button>
    </form>
  );
}

export function LoginFooter() {
  const { t } = useAppearance();
  return <>{t('auth.footer.login')}</>;
}

export function RegisterFooter() {
  const { t } = useAppearance();
  return (
    <>
      {t('auth.footer.registerLead')} <Link to="/login">{t('auth.footer.registerLink')}</Link>.
    </>
  );
}
