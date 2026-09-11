import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LogOut, Mail, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { Field, Input } from '../../components/ui/field.js';
import { useToast } from '../../components/ui/toast-context.js';
import { useAuth } from '../../features/auth/use-auth.js';
import { updateProfile } from '../../lib/api/owner-api.js';

function createProfileSchema(es: boolean) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, es ? 'Usá al menos 2 caracteres.' : 'Use at least 2 characters.')
      .max(50, es ? 'Usá hasta 50 caracteres.' : 'Use up to 50 characters.'),
  });
}

interface ProfileValues {
  name: string;
}

export function OwnerProfileRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const navigate = useNavigate();
  const { logout, updateUser, user } = useAuth();
  const { showToast } = useToast();
  const form = useForm<ProfileValues>({
    defaultValues: { name: user?.name ?? '' },
    resolver: zodResolver(createProfileSchema(es)),
  });
  const mutation = useMutation({ mutationFn: updateProfile });
  if (!user) return null;

  const submit = form.handleSubmit(async (values) => {
    try {
      const updated = await mutation.mutateAsync({ name: values.name });
      updateUser(updated);
      showToast(es ? 'Tus datos se actualizaron.' : 'Your profile was updated.');
    } catch (reason) {
      form.setError('root', {
        message:
          reason instanceof Error
            ? reason.message
            : es
              ? 'No pudimos actualizar tus datos.'
              : 'Unable to update your profile.',
      });
    }
  });

  const signOut = () => {
    logout();
    void navigate('/login', { replace: true });
  };

  return (
    <section className="owner-page space-y-8" aria-labelledby="profile-title">
      <header className="border-b border-[#121417] pb-7">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#6d695f]">
          {es ? 'Tu cuenta' : 'Your account'}
        </p>
        <h1
          className="mt-3 font-display text-4xl font-bold tracking-[-0.055em] text-[#121417] sm:text-5xl"
          id="profile-title"
        >
          {es ? 'Perfil' : 'Profile'}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#45423c] sm:text-base">
          {es
            ? 'Mantené al día cómo te mostramos dentro de la operación.'
            : 'Keep the details we show across your operation up to date.'}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
        <form
          className="rounded-[1.5rem] border border-[#121417]/12 bg-white p-5 sm:p-6 lg:col-span-7"
          noValidate
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <div className="flex items-center gap-3 border-b border-[#121417]/10 pb-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#ffcc00] text-[#121417]">
              <UserRound aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold tracking-[-0.035em] text-[#121417]">
                {es ? 'Datos personales' : 'Personal details'}
              </h2>
              <p className="mt-1 text-sm text-[#6d695f]">
                {es ? 'Lo esencial, sin más vueltas.' : 'Only the details that matter.'}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-5">
            <Field
              error={form.formState.errors.name?.message}
              htmlFor="profile-name"
              label={es ? 'Nombre' : 'Name'}
            >
              <Input id="profile-name" {...form.register('name')} />
            </Field>
            <Field htmlFor="profile-email" label={es ? 'Correo electrónico' : 'Email'}>
              <Input disabled id="profile-email" type="email" value={user.email ?? ''} />
            </Field>
          </div>
          {form.formState.errors.root?.message ? (
            <p
              className="mt-5 rounded-xl border border-[#121417] bg-[#ffcc00] px-4 py-3 text-sm font-semibold text-[#121417]"
              role="alert"
            >
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <Button className="mt-6 rounded-full px-6" disabled={mutation.isPending} type="submit">
            {mutation.isPending
              ? es
                ? 'Guardando…'
                : 'Saving…'
              : es
                ? 'Guardar cambios'
                : 'Save changes'}
          </Button>
        </form>

        <aside className="space-y-5 lg:col-span-4 lg:col-start-9">
          <section className="rounded-[1.5rem] border border-[#121417]/12 bg-[#f5f5f5] p-5 sm:p-6">
            <Mail aria-hidden="true" className="size-5 text-[#121417]" />
            <h2 className="mt-5 font-display text-xl font-bold tracking-[-0.035em] text-[#121417]">
              {es ? 'Inicio de sesión' : 'Sign-in'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#45423c]">
              {es
                ? 'Tu correo identifica la cuenta con la que administrás las cocheras.'
                : 'Your email identifies the account you use to manage facilities.'}
            </p>
            <p className="mt-4 break-all font-mono text-xs font-bold text-[#121417]">
              {user.email}
            </p>
          </section>

          <section className="rounded-[1.5rem] border border-[#121417] bg-white p-5 sm:p-6">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
              {es ? 'Sesión' : 'Session'}
            </p>
            <h2 className="mt-3 font-display text-xl font-bold tracking-[-0.035em] text-[#121417]">
              {es ? '¿Terminaste por hoy?' : 'Finished for today?'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#45423c]">
              {es
                ? 'Podés salir de la cuenta desde acá.'
                : 'You can sign out of this account here.'}
            </p>
            <Button
              className="mt-5 rounded-full"
              onClick={signOut}
              type="button"
              variant="secondary"
            >
              <LogOut aria-hidden="true" className="size-4" />
              {es ? 'Cerrar sesión' : 'Sign out'}
            </Button>
          </section>
        </aside>
      </div>
    </section>
  );
}
