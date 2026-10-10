import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { z } from 'zod';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { FormField } from '../../components/domain/form-field.js';
import { Input } from '../../components/ui/input.js';
import { Toggle } from '../../components/ui/toggle.js';
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
    <section aria-labelledby="auth-title" className="min-h-full bg-background py-12 sm:py-20">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 wide:grid-cols-2 wide:items-stretch wide:px-8">
        <div className="hidden min-w-0 rounded-signature bg-inverse p-10 text-inverse-foreground shadow-md wide:flex wide:flex-col wide:justify-between">
          <div>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-sm font-display text-xl font-black tracking-tight text-inverse-foreground"
              to="/"
            >
              PARKCORE
            </Link>
            <p className="mt-16 text-xs font-bold tracking-eyebrow text-inverse-foreground uppercase">
              {eyebrow}
            </p>
            <p
              aria-hidden="true"
              className="mt-5 font-display text-4xl font-black leading-tight tracking-display"
            >
              {t('auth.frame.headline')}
            </p>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-inverse-foreground/80">
              {t('auth.frame.description')}
            </p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-inverse-foreground/70">
            {t('auth.frame.footer')}
          </p>
        </div>
        <div className="min-w-0 rounded-signature border border-border bg-card p-6 shadow-md sm:p-8 wide:p-10">
          <div>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-sm font-display text-lg font-black tracking-tight text-foreground wide:hidden"
              to="/"
            >
              PARKCORE
            </Link>
            <p className="mt-10 text-xs font-bold tracking-eyebrow text-muted-foreground uppercase wide:mt-0">
              {eyebrow}
            </p>
            <h1
              className="mt-3 max-w-full break-words font-display text-3xl font-black tracking-heading text-foreground wide:text-4xl"
              id="auth-title"
            >
              {title}
            </h1>
          </div>
          <div className="mt-8 [&_.auth-form]:mt-6 [&_.auth-form]:flex [&_.auth-form]:flex-col [&_.auth-form]:gap-4 [&_.field]:space-y-1.5 [&_.field-label]:block [&_.field-label]:text-xs [&_.field-label]:font-bold [&_.field-label]:text-foreground [&_.control]:h-12 [&_.control]:w-full [&_.control]:rounded-2xl [&_.control]:border [&_.control]:border-border [&_.control]:bg-muted [&_.control]:px-4 [&_.control]:text-sm [&_.control]:font-medium [&_.control]:text-foreground [&_.control]:outline-none [&_.control]:transition-colors [&_.control]:focus:border-primary [&_.control]:focus:bg-card [&_.form-error]:text-sm [&_.form-error]:font-medium [&_.form-error]:text-destructive-soft-foreground">
            {children}
          </div>
          <p className="mt-6 border-t border-border-subtle pt-5 text-sm leading-relaxed text-foreground-secondary">
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
      aria-busy={form.formState.isSubmitting}
      className="auth-form"
      noValidate
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <FormField
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
      </FormField>
      <PasswordField
        autoComplete="current-password"
        error={form.formState.errors.password?.message}
        htmlFor="password"
        label={t('auth.fields.password')}
        registration={form.register('password')}
        t={t}
      />
      {form.formState.errors.root?.message ? (
        <p className="form-error" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button className="w-full rounded-full" disabled={form.formState.isSubmitting} type="submit">
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
      const timezone = getBrowserTimezone();
      await registerUser({
        email: values.email,
        lastName: values.lastName,
        name: values.name,
        password: values.password,
        ...(timezone ? { timezone } : {}),
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
      aria-busy={form.formState.isSubmitting}
      className="auth-form"
      noValidate
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <FormField
        error={form.formState.errors.name?.message}
        htmlFor="name"
        label={t('auth.fields.firstName')}
      >
        <Input autoComplete="given-name" autoFocus id="name" {...form.register('name')} />
      </FormField>
      <FormField
        error={form.formState.errors.lastName?.message}
        htmlFor="lastName"
        label={t('auth.fields.lastName')}
      >
        <Input autoComplete="family-name" id="lastName" {...form.register('lastName')} />
      </FormField>
      <FormField
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
      </FormField>
      <PasswordField
        autoComplete="new-password"
        error={form.formState.errors.password?.message}
        help={t('auth.passwordHelp')}
        htmlFor="password"
        label={t('auth.fields.password')}
        registration={form.register('password')}
        t={t}
      />
      {form.formState.errors.root?.message ? (
        <p className="form-error" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button className="w-full rounded-full" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting
          ? t('auth.actions.creatingAccount')
          : t('auth.actions.createAccount')}
      </Button>
    </form>
  );
}

export function LoginFooter({ registerHref = '/register' }: { registerHref?: string } = {}) {
  const { t } = useAppearance();
  return (
    <>
      {t('auth.footer.login')}{' '}
      <Link
        className="font-bold text-foreground underline decoration-brand underline-offset-4"
        to={registerHref}
      >
        {t('auth.footer.loginLink')}
      </Link>
    </>
  );
}

export function RegisterFooter({ loginHref = '/login' }: { loginHref?: string } = {}) {
  const { t } = useAppearance();
  return (
    <>
      {t('auth.footer.registerLead')}{' '}
      <Link
        className="font-bold text-foreground underline decoration-brand underline-offset-4"
        to={loginHref}
      >
        {t('auth.footer.registerLink')}
      </Link>
    </>
  );
}

interface PasswordFieldProps {
  autoComplete: string;
  error?: string;
  help?: string;
  htmlFor: string;
  label: string;
  registration: UseFormRegisterReturn;
  t: Translator;
}

function PasswordField({
  autoComplete,
  error,
  help,
  htmlFor,
  label,
  registration,
  t,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const describedBy = error ? `${htmlFor}-error` : help ? `${htmlFor}-help` : undefined;

  return (
    <FormField error={error} help={help} htmlFor={htmlFor} label={label}>
      <div className="relative">
        <Input
          {...registration}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          autoComplete={autoComplete}
          className="pr-14"
          id={htmlFor}
          type={isVisible ? 'text' : 'password'}
        />
        <Toggle
          aria-controls={htmlFor}
          aria-label={t(isVisible ? 'auth.actions.hidePassword' : 'auth.actions.showPassword')}
          className="absolute inset-y-0 right-0 min-h-11 min-w-11 rounded-md p-0 text-foreground-secondary hover:bg-accent hover:text-foreground"
          onPressedChange={() => {
            setIsVisible((current) => !current);
          }}
          pressed={isVisible}
          size="default"
          type="button"
          variant="default"
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </Toggle>
      </div>
    </FormField>
  );
}

function getBrowserTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone) return undefined;
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return timezone;
  } catch {
    return undefined;
  }
}
