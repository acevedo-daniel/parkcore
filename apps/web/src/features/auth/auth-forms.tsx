import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { z } from 'zod';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { Field, Input } from '../../components/ui/field.js';
import { ApiError } from '../../lib/api/api-error.js';
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
  const { language } = useAppearance();
  return (
    <section
      aria-labelledby="auth-title"
      className="relative min-h-full overflow-hidden bg-[#f7f3ea] py-12 sm:py-20"
    >
      <div
        aria-hidden="true"
        className="absolute -left-20 top-20 size-72 rounded-full border-[28px] border-[#e7bf45]/65"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-24 size-96 rounded-full bg-[#d9e2d1]"
      />
      <div className="relative mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-stretch lg:px-8">
        <div className="hidden rounded-[3rem_3rem_7rem_3rem] bg-[#294236] p-10 text-[#fffdf7] shadow-[0_12px_0_rgba(29,36,31,0.15)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link
              className="inline-flex items-center gap-2 font-display text-xl font-black tracking-tight text-[#fffdf7]"
              to="/"
            >
              PARKCORE <span className="size-2 rounded-full bg-[#f5df88]" />
            </Link>
            <p className="mt-16 text-xs font-bold tracking-[0.12em] text-[#f5df88] uppercase">
              {eyebrow}
            </p>
            <p
              aria-hidden="true"
              className="mt-5 font-display text-4xl font-black leading-[1.02] tracking-[-0.05em]"
            >
              {language === 'es'
                ? 'Una operación clara, desde la entrada hasta el cierre.'
                : 'A clear operation, from arrival through closeout.'}
            </p>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-[#d9e2d1]">
              Una entrada directa para volver a la operación, sin configurar nada de más.
            </p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#b6c3b3]">
            La demo usa datos de ejemplo para recorrer una jornada completa de cochera.
          </p>
        </div>
        <div className="rounded-[2rem_2rem_4.5rem_2rem] border border-[#1d241f]/10 bg-[#fffdf7] p-6 shadow-[0_10px_0_rgba(29,36,31,0.08)] sm:p-8 lg:p-10">
          <div>
            <Link
              className="inline-flex items-center gap-2 font-display text-lg font-black tracking-tight text-[#1d241f] lg:hidden"
              to="/"
            >
              PARKCORE <span className="size-2 rounded-full bg-[#e7bf45]" />
            </Link>
            <p className="mt-10 text-xs font-bold tracking-[0.12em] text-[#b14d30] uppercase lg:mt-0">
              {eyebrow}
            </p>
            <h1
              className="mt-3 font-display text-3xl font-black tracking-[-0.04em] text-[#1d241f] lg:text-4xl"
              id="auth-title"
            >
              {title}
            </h1>
          </div>
          <div className="mt-8 [&_.auth-form]:mt-6 [&_.auth-form]:flex [&_.auth-form]:flex-col [&_.auth-form]:gap-4 [&_.field]:space-y-1.5 [&_.field-label]:block [&_.field-label]:text-xs [&_.field-label]:font-bold [&_.field-label]:text-[#465245] [&_.control]:h-12 [&_.control]:w-full [&_.control]:rounded-2xl [&_.control]:border [&_.control]:border-[#1d241f]/10 [&_.control]:bg-[#f3eddf] [&_.control]:px-4 [&_.control]:text-sm [&_.control]:font-medium [&_.control]:text-[#1d241f] [&_.control]:outline-none [&_.control]:transition-colors [&_.control]:focus:border-[#1d241f]/30 [&_.control]:focus:bg-white [&_.form-error]:text-sm [&_.form-error]:font-medium [&_.form-error]:text-[#b42318]">
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
  const { login } = useAuth();
  const { language } = useAppearance();
  const es = language === 'es';
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
      <Field
        error={form.formState.errors.password?.message}
        htmlFor="password"
        label={es ? 'Contraseña' : 'Password'}
      >
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
      <Button
        className="h-12 rounded-full bg-[#1d241f] text-[#fffdf7] hover:bg-[#294236]"
        disabled={form.formState.isSubmitting}
        fullWidth
        type="submit"
      >
        {form.formState.isSubmitting
          ? es
            ? 'Ingresando…'
            : 'Signing in…'
          : es
            ? 'Ingresar'
            : 'Sign in'}
      </Button>
    </form>
  );
}

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { register: registerUser } = useAuth();
  const { language } = useAppearance();
  const es = language === 'es';
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
      <Field
        error={form.formState.errors.name?.message}
        htmlFor="name"
        label={es ? 'Nombre (opcional)' : 'Name (optional)'}
      >
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
      <Field
        error={form.formState.errors.password?.message}
        htmlFor="password"
        label={es ? 'Contraseña' : 'Password'}
      >
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
      <Button
        className="h-12 rounded-full bg-[#1d241f] text-[#fffdf7] hover:bg-[#294236]"
        disabled={form.formState.isSubmitting}
        fullWidth
        type="submit"
      >
        {form.formState.isSubmitting
          ? es
            ? 'Creando cuenta…'
            : 'Creating account…'
          : es
            ? 'Crear cuenta'
            : 'Create account'}
      </Button>
    </form>
  );
}

export function LoginFooter() {
  const { language } = useAppearance();
  return language === 'es' ? (
    <>El acceso se habilita desde la cochera.</>
  ) : (
    <>Access is provisioned by the facility owner.</>
  );
}

export function RegisterFooter() {
  const { language } = useAppearance();
  return language === 'es' ? (
    <>
      ¿Ya tenés una cuenta? <Link to="/login">Ingresá</Link>.
    </>
  ) : (
    <>
      Already have an account? <Link to="/login">Sign in</Link>.
    </>
  );
}
