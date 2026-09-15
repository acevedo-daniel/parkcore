import type { components } from '@parkcore/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useAppearance } from '../../app/appearance-provider.js';
import { lookupVehicle } from '../../lib/api/owner-api.js';
import type { Translator } from '../../lib/localization.js';
import { normalizePlate } from '../../lib/plate.js';
import { useDebouncedValue } from '../../lib/use-debounced-value.js';
import { Button } from '../ui/button.js';
import { Field, Input, Select, Textarea } from '../ui/field.js';

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
type LookupState = 'loading' | 'match' | 'no-match' | 'error';

const controlClassName =
  'h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface-subtle px-3.5 text-foreground shadow-xs focus:border-primary focus:ring-2 focus:ring-focus-ring';

export function CheckInPanel({
  error,
  isSubmitting,
  onSubmit,
  parkingId,
}: {
  error?: string;
  isSubmitting?: boolean;
  onSubmit: (input: CheckInRequest) => void | Promise<void>;
  parkingId?: string;
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
    getValues,
    handleSubmit,
    register,
    setValue,
  } = form;
  const normalizedPlate = normalizePlate(useWatch({ control: form.control, name: 'plate' }));
  const debouncedPlate = useDebouncedValue(normalizedPlate, 300);
  const [lookupResult, setLookupResult] = useState<{
    parkingId: string;
    plate: string;
    state: LookupState;
  }>();
  const lookupRequestVersion = useRef(0);
  const prefilledVehicle = useRef<{ parkingId: string; plate: string } | null>(null);

  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) void form.trigger();
  }, [form, t]);

  useEffect(() => {
    lookupRequestVersion.current += 1;
    const prefill = prefilledVehicle.current;
    if (prefill && (prefill.parkingId !== parkingId || prefill.plate !== normalizedPlate)) {
      setValue('type', 'CAR');
      setValue('brand', '');
      setValue('model', '');
      prefilledVehicle.current = null;
    }
  }, [normalizedPlate, parkingId, setValue]);

  useEffect(() => {
    if (!parkingId || debouncedPlate.length < 5) return;

    const requestVersion = ++lookupRequestVersion.current;
    let isCurrent = true;

    const isCurrentLookup = () =>
      isCurrent &&
      lookupRequestVersion.current === requestVersion &&
      normalizePlate(getValues('plate')) === debouncedPlate;

    const loadingTimer = window.setTimeout(() => {
      if (isCurrentLookup()) {
        setLookupResult({ parkingId, plate: debouncedPlate, state: 'loading' });
      }
    });

    void Promise.resolve(lookupVehicle(parkingId, debouncedPlate))
      .then((result) => {
        window.clearTimeout(loadingTimer);
        if (!isCurrentLookup()) return;
        if (result.vehicle) {
          setValue('type', result.vehicle.type);
          setValue('brand', result.vehicle.brand ?? '');
          setValue('model', result.vehicle.model ?? '');
          prefilledVehicle.current = { parkingId, plate: debouncedPlate };
          setLookupResult({ parkingId, plate: debouncedPlate, state: 'match' });
        } else {
          prefilledVehicle.current = null;
          setLookupResult({ parkingId, plate: debouncedPlate, state: 'no-match' });
        }
      })
      .catch(() => {
        window.clearTimeout(loadingTimer);
        if (isCurrentLookup()) {
          setLookupResult({ parkingId, plate: debouncedPlate, state: 'error' });
        }
      });

    return () => {
      isCurrent = false;
      window.clearTimeout(loadingTimer);
    };
  }, [debouncedPlate, getValues, parkingId, setValue]);

  const currentLookupState =
    lookupResult && lookupResult.parkingId === parkingId && lookupResult.plate === normalizedPlate
      ? lookupResult.state
      : undefined;
  const lookupMessage =
    parkingId && normalizedPlate.length > 0
      ? normalizedPlate.length < 5
        ? t('checkIn.lookupInvalid')
        : currentLookupState === 'loading'
          ? t('checkIn.lookupSearching')
          : currentLookupState === 'match'
            ? t('checkIn.lookupMatch')
            : currentLookupState === 'no-match'
              ? t('checkIn.lookupNoMatch')
              : currentLookupState === 'error'
                ? t('checkIn.lookupFailure')
                : undefined
      : undefined;

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
      {lookupMessage ? (
        <p className="text-sm leading-relaxed text-foreground-secondary" role="status">
          {lookupMessage}
        </p>
      ) : null}

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
          className="break-words rounded-[var(--radius-md)] border border-warning-foreground bg-warning-surface p-3 text-sm font-semibold text-warning-text"
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
