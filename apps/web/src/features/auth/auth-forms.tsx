import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { z } from 'zod';

import { ApiError } from '../../lib/api/api-error.js';
import { Button } from '../../components/ui/button.js';
import { Field, Input } from '../../components/ui/field.js';
import { useAuth } from './use-auth.js';

const emailSchema = z.string().trim().pipe(z.email('Enter a valid email address.'));
const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(100, 'Use no more than 100 characters.');

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Use at least 2 characters.').max(50).optional().or(z.literal('')),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

function formErrorMessage(error: unknown, action: 'register' | 'sign in') {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Email or password is incorrect.';
    if (error.status === 409) return 'An account with this email already exists.';
    if (error.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    return error.message;
  }
  return `Unable to ${action}. Check your connection and try again.`;
}

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
  return (
    <section className="auth-frame" aria-labelledby="auth-title">
      <div className="auth-intro">
        <p className="type-label">{eyebrow}</p>
        <h1 className="type-page-title" id="auth-title">
          {title}
        </h1>
      </div>
      {children}
      <p className="auth-footer type-small">{footer}</p>
    </section>
  );
}

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth();
  const form = useForm<LoginValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await login(values);
      onSuccess();
    } catch (error) {
      form.setError('root', { message: formErrorMessage(error, 'sign in') });
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
      <Field error={form.formState.errors.email?.message} htmlFor="email" label="Email">
        <Input
          autoComplete="email"
          autoFocus
          aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
          aria-invalid={Boolean(form.formState.errors.email)}
          id="email"
          inputMode="email"
          type="email"
          {...form.register('email')}
        />
      </Field>
      <Field error={form.formState.errors.password?.message} htmlFor="password" label="Password">
        <Input
          autoComplete="current-password"
          aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
          aria-invalid={Boolean(form.formState.errors.password)}
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
      <Button fullWidth disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { register: registerUser } = useAuth();
  const form = useForm<RegisterValues>({
    defaultValues: { email: '', name: '', password: '' },
    resolver: zodResolver(registerSchema),
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await registerUser({
        email: values.email,
        ...(values.name ? { name: values.name } : {}),
        password: values.password,
      });
      onSuccess();
    } catch (error) {
      form.setError('root', { message: formErrorMessage(error, 'register') });
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
      <Field error={form.formState.errors.name?.message} htmlFor="name" label="Name (optional)">
        <Input
          aria-describedby={form.formState.errors.name ? 'name-error' : undefined}
          aria-invalid={Boolean(form.formState.errors.name)}
          autoComplete="name"
          id="name"
          {...form.register('name')}
        />
      </Field>
      <Field error={form.formState.errors.email?.message} htmlFor="email" label="Email">
        <Input
          autoComplete="email"
          autoFocus
          aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
          aria-invalid={Boolean(form.formState.errors.email)}
          id="email"
          inputMode="email"
          type="email"
          {...form.register('email')}
        />
      </Field>
      <Field error={form.formState.errors.password?.message} htmlFor="password" label="Password">
        <Input
          autoComplete="new-password"
          aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
          aria-invalid={Boolean(form.formState.errors.password)}
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
      <Button fullWidth disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}

export function LoginFooter() {
  return (
    <>
      No account yet? <Link to="/register">Get started</Link>.
    </>
  );
}

export function RegisterFooter() {
  return (
    <>
      Already have an account? <Link to="/login">Sign in</Link>.
    </>
  );
}
