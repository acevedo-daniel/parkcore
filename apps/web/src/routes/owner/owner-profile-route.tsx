import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LogOut, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { useAppearance } from '../../app/appearance-provider.js';
import { PageHeader } from '../../components/domain/page-header.js';
import { AppearanceControls } from '../../components/ui/appearance-controls.js';
import { Button } from '../../components/ui/button.js';
import { Combobox, type ComboboxOption } from '../../components/ui/combobox.js';
import { Skeleton } from '../../components/ui/feedback.js';
import { Field, Input } from '../../components/ui/field.js';
import { useToast } from '../../components/ui/toast-context.js';
import { DemoResetControl } from '../../features/auth/demo-reset-control.js';
import { useAuth } from '../../features/auth/use-auth.js';
import { localizeApiError } from '../../lib/api/api-error.js';
import type { User } from '../../lib/api/auth-api.js';
import { updateProfile, type UpdateProfileRequest } from '../../lib/api/owner-api.js';
import type { Locale, Translator } from '../../lib/localization.js';
import { getTimezoneOptions } from '../../lib/timezones.js';

function createProfileSchema(t: Translator) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, t('validation.profileNameMin', { count: 2 }))
      .max(50, t('validation.profileNameMax', { count: 50 }))
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(2, t('validation.lastNameMin', { count: 2 }))
      .max(50, t('validation.lastNameMax', { count: 50 }))
      .optional(),
    timezone: z.string().trim().min(1, t('validation.profileTimezoneRequired')),
  });
}

type ProfileValues = z.infer<ReturnType<typeof createProfileSchema>>;
type SaveStatus = 'idle' | 'success';

export function OwnerProfileRoute() {
  const { t } = useAppearance();
  const { user } = useAuth();
  if (!user) {
    return (
      <section aria-labelledby="profile-loading-title" className="owner-page space-y-6">
        <h1 className="visually-hidden" id="profile-loading-title">
          {t('profile.title')}
        </h1>
        <p className="visually-hidden" role="status">
          {t('profile.loading')}
        </p>
        <Skeleton className="min-h-96 w-full" />
      </section>
    );
  }
  return <OwnerProfileContent user={user} />;
}

function OwnerProfileContent({ user }: { user: User }) {
  const { locale, t } = useAppearance();
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const isOwner = user.kind === 'OWNER';
  const isDemo = user.kind === 'DEMO';
  const schema = useMemo(() => createProfileSchema(t), [t]);
  const timezoneOptions = useMemo<readonly ComboboxOption[]>(
    () => getTimezoneOptions().map((timezone) => ({ label: timezone, value: timezone })),
    [],
  );
  const form = useForm<ProfileValues>({
    defaultValues: {
      ...(isOwner ? { name: user.name ?? '', lastName: user.lastName ?? '' } : {}),
      timezone: user.timezone,
    },
    resolver: zodResolver(schema),
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const mutation = useMutation({ mutationFn: updateProfile });
  const { dirtyFields, errors, isDirty } = form.formState;

  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) void form.trigger();
  }, [form, t]);

  const clearSaveFeedback = () => {
    if (saveStatus !== 'idle') setSaveStatus('idle');
    if (form.formState.errors.root) form.clearErrors('root');
  };

  const submit = form.handleSubmit(async (values) => {
    const input: UpdateProfileRequest = {};
    if (isOwner && dirtyFields.name && values.name !== undefined) input.name = values.name;
    if (isOwner && dirtyFields.lastName && values.lastName !== undefined) {
      input.lastName = values.lastName;
    }
    if (dirtyFields.timezone) input.timezone = values.timezone;
    if (Object.keys(input).length === 0) return;

    setSaveStatus('idle');
    try {
      const updated = await mutation.mutateAsync(input);
      updateUser(updated);
      form.reset({
        ...(isOwner ? { name: updated.name ?? '', lastName: updated.lastName ?? '' } : {}),
        timezone: updated.timezone,
      });
      setSaveStatus('success');
      showToast(t('profile.updated'));
    } catch (reason) {
      form.setError('root', {
        message: localizeApiError(reason, t, 'api.updateProfile'),
      });
    }
  });

  const signOut = () => {
    logout();
    void navigate('/login', { replace: true });
  };

  return (
    <section aria-labelledby="profile-title" className="owner-page space-y-9">
      <PageHeader
        description={t('profile.description')}
        eyebrow={t('profile.account')}
        id="profile-title"
        title={t('profile.title')}
      />

      <form
        aria-busy={mutation.isPending}
        className="space-y-8"
        noValidate
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <section
          aria-labelledby="profile-account-title"
          className="border-b border-border-subtle pb-8"
        >
          <p className="type-label text-foreground-muted">{t('profile.accountSection')}</p>
          {isOwner ? (
            <>
              <h2 className="mt-3 type-section-title" id="profile-account-title">
                {t('profile.details')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
                {t('profile.accountDescription')}
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field
                  error={errors.name?.message}
                  htmlFor="profile-name"
                  label={t('profile.name')}
                >
                  <Input
                    autoComplete="given-name"
                    id="profile-name"
                    required
                    {...form.register('name', { onChange: clearSaveFeedback })}
                  />
                </Field>
                <Field
                  error={errors.lastName?.message}
                  htmlFor="profile-last-name"
                  label={t('profile.lastName')}
                >
                  <Input
                    autoComplete="family-name"
                    id="profile-last-name"
                    required
                    {...form.register('lastName', { onChange: clearSaveFeedback })}
                  />
                </Field>
                <Field
                  help={t('profile.emailReadOnly')}
                  htmlFor="profile-email"
                  label={t('profile.email')}
                >
                  <Input
                    autoComplete="email"
                    aria-readonly="true"
                    id="profile-email"
                    readOnly
                    type="email"
                    value={user.email ?? ''}
                  />
                </Field>
              </div>
            </>
          ) : (
            <DemoSessionDisclosure locale={locale} t={t} user={user} />
          )}
        </section>

        <section
          aria-labelledby="profile-preferences-title"
          className="border-b border-border-subtle pb-8"
        >
          <p className="type-label text-foreground-muted">{t('profile.preferences')}</p>
          <h2 className="mt-3 type-section-title" id="profile-preferences-title">
            {t('profile.languageAppearance')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
            {t('profile.preferencesDescription')}
          </p>
          <div className="mt-5 max-w-xl">
            <AppearanceControls presentation="profile" />
          </div>
          <div className="mt-7 max-w-xl">
            <Controller
              control={form.control}
              name="timezone"
              render={({ field, fieldState }) => {
                const options = timezoneOptions.some((option) => option.value === field.value)
                  ? timezoneOptions
                  : [...timezoneOptions, { label: field.value, value: field.value }];
                const messageId = 'profile-timezone-message';
                return (
                  <div className="space-y-1.5">
                    <Combobox
                      aria-describedby={messageId}
                      aria-invalid={fieldState.error ? true : undefined}
                      aria-required="true"
                      id="profile-timezone"
                      label={t('profile.timezone')}
                      onBlur={field.onBlur}
                      onValueChange={(value) => {
                        clearSaveFeedback();
                        field.onChange(value);
                      }}
                      options={options}
                      ref={field.ref}
                      value={field.value}
                    />
                    <p
                      className={
                        fieldState.error
                          ? 'field-error text-sm font-medium text-danger-text'
                          : 'field-help text-sm leading-relaxed text-foreground-muted'
                      }
                      id={messageId}
                      role={fieldState.error ? 'alert' : undefined}
                    >
                      {fieldState.error?.message ?? t('profile.timezoneHelp')}
                    </p>
                  </div>
                );
              }}
            />
          </div>
        </section>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Button disabled={mutation.isPending || !isDirty} type="submit">
            {mutation.isPending ? t('profile.saving') : t('profile.save')}
          </Button>
          {errors.root?.message ? (
            <p className="text-sm font-semibold text-danger-text" role="alert">
              {errors.root.message}
            </p>
          ) : saveStatus === 'success' ? (
            <p aria-live="polite" className="text-sm font-semibold text-success-text" role="status">
              {t('profile.updated')}
            </p>
          ) : null}
        </div>
      </form>

      {isDemo ? (
        <section
          aria-labelledby="profile-demo-data-title"
          className="border-b border-border-subtle pb-8"
        >
          <p className="type-label text-foreground-muted">{t('profile.demoData')}</p>
          <h2 className="mt-3 type-section-title" id="profile-demo-data-title">
            {t('profile.demoDataTitle')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
            {t('profile.demoDataDescription')}
          </p>
          <div className="mt-5">
            <DemoResetControl />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="profile-session-title">
        <p className="type-label text-foreground-muted">{t('profile.session')}</p>
        <h2 className="mt-3 type-section-title" id="profile-session-title">
          {t('profile.finished')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
          {t('profile.signOutDescription')}
        </p>
        <Button className="mt-5" onClick={signOut} type="button" variant="secondary">
          <LogOut aria-hidden="true" className="size-4" />
          {t('profile.signOut')}
        </Button>
      </section>
    </section>
  );
}

function DemoSessionDisclosure({ locale, t, user }: { locale: Locale; t: Translator; user: User }) {
  return (
    <div className="mt-4 flex min-w-0 flex-col gap-5 rounded-[var(--radius-lg)] border border-accent-foreground/30 bg-accent-soft p-5 text-foreground sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <UserRound aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="type-section-title" id="profile-account-title">
            {t('profile.demoSession')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed">
            {t('profile.demoSessionDescription')}
          </p>
        </div>
      </div>
      <div className="min-w-0 shrink-0 sm:text-right">
        <p className="type-label">{t('profile.demoExpires')}</p>
        {user.demoExpiresAt ? (
          <time className="mt-2 block break-words type-operational" dateTime={user.demoExpiresAt}>
            {formatDemoExpiry(user.demoExpiresAt, user.timezone, locale)}
          </time>
        ) : (
          <p className="mt-2 type-operational">{t('common.notAvailable')}</p>
        )}
      </div>
    </div>
  );
}

function formatDemoExpiry(value: string, timezone: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(value));
}
