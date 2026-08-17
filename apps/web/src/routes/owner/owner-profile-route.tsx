import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { Button } from '../../components/ui/button.js';
import { Field, Input } from '../../components/ui/field.js';
import { useToast } from '../../components/ui/toast-context.js';
import { useAuth } from '../../features/auth/use-auth.js';
import { updateProfile } from '../../lib/api/owner-api.js';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Use at least 2 characters.').max(50),
});
type ProfileValues = z.infer<typeof profileSchema>;

export function OwnerProfileRoute() {
  const navigate = useNavigate();
  const { logout, updateUser, user } = useAuth();
  const { showToast } = useToast();
  const form = useForm<ProfileValues>({
    defaultValues: { name: user?.name ?? '' },
    resolver: zodResolver(profileSchema),
  });
  const mutation = useMutation({ mutationFn: updateProfile });
  if (!user) return null;

  const submit = form.handleSubmit(async (values) => {
    try {
      const updated = await mutation.mutateAsync({ name: values.name });
      updateUser(updated);
      showToast('Profile updated.');
    } catch (reason) {
      form.setError('root', {
        message: reason instanceof Error ? reason.message : 'Unable to update your profile.',
      });
    }
  });

  const signOut = () => {
    logout();
    void navigate('/login', { replace: true });
  };

  return (
    <section className="owner-page profile-page stack-owner" aria-labelledby="profile-title">
      <header>
        <p className="type-label">Account</p>
        <h1 className="type-page-title" id="profile-title">
          Profile
        </h1>
      </header>
      <form
        className="profile-form"
        noValidate
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <Field error={form.formState.errors.name?.message} htmlFor="profile-name" label="Name">
          <Input id="profile-name" {...form.register('name')} />
        </Field>
        <Field htmlFor="profile-email" label="Email">
          <Input disabled id="profile-email" type="email" value={user.email} />
        </Field>
        {form.formState.errors.root?.message ? (
          <p className="form-error" role="alert">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <Button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
      <section className="profile-sign-out">
        <p className="type-label">Session</p>
        <Button type="button" variant="secondary" onClick={signOut}>
          Sign out
        </Button>
      </section>
    </section>
  );
}
