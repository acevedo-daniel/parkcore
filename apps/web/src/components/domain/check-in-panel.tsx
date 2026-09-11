import type { components } from '@parkcore/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, type SyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAppearance } from '../../app/appearance-provider.js';
import type { Translator } from '../../lib/localization.js';
import { Button } from '../ui/button.js';
import { Field, Input, Select, Textarea } from '../ui/field.js';

const normalizePlate = (plate: string) =>
  plate
    .trim()
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]/g, '');

function createCheckInFormSchema(t: Translator) {
  return z.object({
    brand: z
      .string()
      .trim()
      .max(50, t('validation.checkInFieldMax', { count: 50 })),
    customerName: z
      .string()
      .trim()
      .max(100, t('validation.checkInFieldMax', { count: 100 })),
    customerPhone: z
      .string()
      .trim()
      .max(20, t('validation.checkInFieldMax', { count: 20 })),
    model: z
      .string()
      .trim()
      .max(50, t('validation.checkInFieldMax', { count: 50 })),
    notes: z
      .string()
      .trim()
      .max(500, t('validation.checkInFieldMax', { count: 500 })),
    plate: z
      .string()
      .transform(normalizePlate)
      .pipe(
        z
          .string()
          .min(1, t('validation.checkInPlateRequired'))
          .min(4, t('validation.checkInPlateLength'))
          .max(10, t('validation.checkInPlateLength')),
      ),
    type: z.enum(['CAR', 'MOTORCYCLE', 'LARGE']),
  });
}

type CheckInForm = z.infer<ReturnType<typeof createCheckInFormSchema>>;
type CheckInRequest = components['schemas']['CheckInRequest'];

const controlClassName =
  'h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface-subtle px-3.5 text-foreground shadow-xs focus:border-primary focus:ring-2 focus:ring-focus-ring';

export function CheckInPanel({
  error,
  isSubmitting,
  onSubmit,
}: {
  error?: string;
  isSubmitting?: boolean;
  onSubmit: (input: CheckInRequest) => void | Promise<void>;
}) {
  const { t } = useAppearance();
  const schema = useMemo(() => createCheckInFormSchema(t), [t]);
  const form = useForm<CheckInForm>({
    defaultValues: {
      brand: '',
      customerName: '',
      customerPhone: '',
      model: '',
      notes: '',
      plate: '',
      type: 'CAR',
    },
    resolver: zodResolver(schema),
  });
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = form;
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) void form.trigger();
  }, [form, t]);

  const submit = async (values: CheckInForm) => {
    const optional = (value: string) => value.trim() || undefined;
    await onSubmit({
      brand: optional(values.brand),
      customerName: optional(values.customerName),
      customerPhone: optional(values.customerPhone),
      model: optional(values.model),
      notes: optional(values.notes),
      plate: values.plate,
      type: values.type,
    });
  };

  const onFormSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit((values) => {
      void submit(values);
    })(event);
  };

  return (
    <form className="space-y-5 pt-6" noValidate onSubmit={onFormSubmit}>
      <Field error={errors.plate?.message} htmlFor="check-in-plate" label={t('checkIn.plate')}>
        <Input
          autoComplete="off"
          className={`${controlClassName} font-mono font-bold tracking-[0.12em]`}
          id="check-in-plate"
          placeholder={t('checkIn.platePlaceholder')}
          {...register('plate')}
        />
      </Field>
      <p className="text-sm leading-relaxed text-foreground-secondary">{t('checkIn.plateHelp')}</p>

      <FormDivider label={t('checkIn.vehicle')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field error={errors.type?.message} htmlFor="check-in-type" label={t('checkIn.type')}>
          <Select className={controlClassName} id="check-in-type" {...register('type')}>
            <option value="CAR">{t('checkIn.car')}</option>
            <option value="MOTORCYCLE">{t('checkIn.motorcycle')}</option>
            <option value="LARGE">{t('checkIn.largeVehicle')}</option>
          </Select>
        </Field>
        <Field htmlFor="check-in-brand" label={t('checkIn.brand')}>
          <Input className={controlClassName} id="check-in-brand" {...register('brand')} />
        </Field>
      </div>
      <Field htmlFor="check-in-model" label={t('checkIn.model')}>
        <Input className={controlClassName} id="check-in-model" {...register('model')} />
      </Field>

      <FormDivider label={t('checkIn.visitorOptional')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field htmlFor="check-in-name" label={t('checkIn.name')}>
          <Input className={controlClassName} id="check-in-name" {...register('customerName')} />
        </Field>
        <Field htmlFor="check-in-phone" label={t('checkIn.phone')}>
          <Input
            className={controlClassName}
            id="check-in-phone"
            inputMode="tel"
            {...register('customerPhone')}
          />
        </Field>
      </div>
      <Field htmlFor="check-in-notes" label={t('checkIn.notes')}>
        <Textarea
          className="min-h-24 w-full rounded-[var(--radius-md)] border border-border bg-surface-subtle px-3.5 py-3 text-foreground shadow-xs focus:border-primary focus:ring-2 focus:ring-focus-ring"
          id="check-in-notes"
          {...register('notes')}
        />
      </Field>

      {error ? (
        <p
          className="rounded-[var(--radius-md)] border border-warning-foreground bg-warning-surface p-3 text-sm font-semibold text-warning-text"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Button disabled={isSubmitting} fullWidth type="submit">
        {isSubmitting ? t('checkIn.starting') : t('checkIn.start')}
      </Button>
    </form>
  );
}

function FormDivider({ label }: { label: string }) {
  return (
    <div className="border-t border-border-subtle pt-5">
      <span className="type-label text-foreground-muted">{label}</span>
    </div>
  );
}
