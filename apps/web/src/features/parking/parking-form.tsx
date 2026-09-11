import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { Field, Input, Select, Textarea } from '../../components/ui/field.js';
import { Switch } from '../../components/ui/switch.js';
import type { CreateParkingRequest, Parking } from '../../lib/api/owner-api.js';
import type { Translator } from '../../lib/localization.js';

function createParkingFormSchema(t: Translator) {
  return z
    .object({
      address: z
        .string()
        .trim()
        .min(5, t('validation.parkingAddressMin', { count: 5 }))
        .max(200),
      capacity: z
        .number({ error: t('validation.number') })
        .int(t('validation.parkingCapacityInteger'))
        .positive(t('validation.parkingCapacityPositive')),
      closesAt: z.string(),
      currency: z.enum(['ARS', 'USD']),
      description: z
        .string()
        .trim()
        .max(500, t('validation.parkingDescriptionMax', { count: 500 })),
      hourlyRate: z
        .number({ error: t('validation.number') })
        .positive(t('validation.parkingRatePositive')),
      image: z.union([z.literal(''), z.url(t('validation.parkingImageUrl'))]),
      isActive: z.boolean(),
      is24Hours: z.boolean(),
      isListed: z.boolean(),
      lat: z
        .number({ error: t('validation.number') })
        .min(-90, t('validation.parkingLatitude'))
        .max(90, t('validation.parkingLatitude')),
      lng: z
        .number({ error: t('validation.number') })
        .min(-180, t('validation.parkingLongitude'))
        .max(180, t('validation.parkingLongitude')),
      neighborhood: z
        .string()
        .trim()
        .min(2, t('validation.parkingNeighborhoodMin', { count: 2 }))
        .max(100),
      opensAt: z.string(),
      title: z
        .string()
        .trim()
        .min(5, t('validation.parkingTitleMin', { count: 5 }))
        .max(100),
      timezone: z.string().trim().min(1, t('validation.parkingTimezone')),
    })
    .superRefine((values, context) => {
      if (values.is24Hours) return;
      if (!values.opensAt || !values.closesAt) {
        context.addIssue({
          code: 'custom',
          path: ['opensAt'],
          message: t('validation.parkingHoursRequired'),
        });
        return;
      }
      if (values.opensAt === values.closesAt) {
        context.addIssue({
          code: 'custom',
          path: ['closesAt'],
          message: t('validation.parkingHoursEqual'),
        });
      }
    });
}

type ParkingFormValues = z.infer<ReturnType<typeof createParkingFormSchema>>;

function defaults(parking?: Parking) {
  return {
    address: parking?.address ?? '',
    capacity: parking?.capacity ?? 1,
    closesAt: parking?.closesAt ?? '',
    currency: parking?.currency ?? 'USD',
    description: parking?.description ?? '',
    hourlyRate: parking ? parking.hourlyRateCents / 100 : 1,
    image: parking?.image ?? '',
    isActive: parking?.isActive ?? true,
    is24Hours: parking?.is24Hours ?? true,
    isListed: parking?.isListed ?? false,
    lat: parking?.lat,
    lng: parking?.lng,
    neighborhood: parking?.neighborhood ?? '',
    opensAt: parking?.opensAt ?? '',
    title: parking?.title ?? '',
    timezone: parking?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function toRequest(values: ParkingFormValues): CreateParkingRequest {
  return {
    address: values.address,
    capacity: values.capacity,
    closesAt: values.is24Hours ? null : values.closesAt,
    currency: values.currency,
    ...(values.description ? { description: values.description } : {}),
    hourlyRateCents: Math.round(values.hourlyRate * 100),
    ...(values.image ? { image: values.image } : {}),
    is24Hours: values.is24Hours,
    isListed: values.isListed,
    lat: values.lat,
    lng: values.lng,
    neighborhood: values.neighborhood,
    opensAt: values.is24Hours ? null : values.opensAt,
    title: values.title,
    timezone: values.timezone,
  };
}

export function ParkingForm({
  error,
  isSubmitting,
  onSubmit,
  parking,
}: {
  error?: string;
  isSubmitting?: boolean;
  onSubmit: (input: CreateParkingRequest & { isActive?: boolean }) => Promise<void> | void;
  parking?: Parking;
}) {
  const { t } = useAppearance();
  const schema = useMemo(() => createParkingFormSchema(t), [t]);
  const form = useForm<ParkingFormValues>({
    defaultValues: defaults(parking),
    resolver: zodResolver(schema),
  });
  const is24Hours = useWatch({ control: form.control, name: 'is24Hours' });
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) void form.trigger();
  }, [form, t]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit({ ...toRequest(values), ...(parking ? { isActive: values.isActive } : {}) });
  });

  return (
    <form
      className="parking-form grid gap-5 lg:grid-cols-2"
      noValidate
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <fieldset className="space-y-5 rounded-[1.5rem] border border-[#121417]/12 bg-white p-5 sm:p-6 lg:col-span-2">
        <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
          {t('parkingForm.general')}
        </legend>
        <Field
          error={form.formState.errors.title?.message}
          htmlFor="parking-title"
          label={t('parkingForm.title')}
        >
          <Input id="parking-title" {...form.register('title')} />
        </Field>
        <Field
          error={form.formState.errors.neighborhood?.message}
          htmlFor="parking-neighborhood"
          label={t('parkingForm.neighborhood')}
        >
          <Input id="parking-neighborhood" {...form.register('neighborhood')} />
        </Field>
        <Field
          error={form.formState.errors.description?.message}
          htmlFor="parking-description"
          label={t('parkingForm.description')}
        >
          <Textarea id="parking-description" rows={4} {...form.register('description')} />
        </Field>
        <Field
          error={form.formState.errors.image?.message}
          htmlFor="parking-image"
          label={t('parkingForm.imageUrl')}
        >
          <Input id="parking-image" inputMode="url" type="url" {...form.register('image')} />
        </Field>
      </fieldset>
      <fieldset className="space-y-5 rounded-[1.5rem] border border-[#121417]/12 bg-white p-5 sm:p-6">
        <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
          {t('parkingForm.location')}
        </legend>
        <Field
          error={form.formState.errors.address?.message}
          htmlFor="parking-address"
          label={t('parkingForm.address')}
        >
          <Input id="parking-address" {...form.register('address')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            error={form.formState.errors.lat?.message}
            htmlFor="parking-lat"
            label={t('parkingForm.latitude')}
          >
            <Input
              id="parking-lat"
              required
              step="any"
              type="number"
              {...form.register('lat', { valueAsNumber: true })}
            />
          </Field>
          <Field
            error={form.formState.errors.lng?.message}
            htmlFor="parking-lng"
            label={t('parkingForm.longitude')}
          >
            <Input
              id="parking-lng"
              required
              step="any"
              type="number"
              {...form.register('lng', { valueAsNumber: true })}
            />
          </Field>
        </div>
        <Field
          error={form.formState.errors.timezone?.message}
          htmlFor="parking-timezone"
          label={t('parkingForm.timezone')}
        >
          <Input id="parking-timezone" {...form.register('timezone')} />
        </Field>
      </fieldset>
      <fieldset className="space-y-5 rounded-[1.5rem] border border-[#121417]/12 bg-white p-5 sm:p-6">
        <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
          {t('parkingForm.hours')}
        </legend>
        <Switch
          description={t('parkingForm.open24HoursDescription')}
          id="parking-24-hours"
          label={t('parkingForm.open24Hours')}
          {...form.register('is24Hours')}
        />
        {!is24Hours ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              error={form.formState.errors.opensAt?.message}
              htmlFor="parking-opens-at"
              label={t('parkingForm.opening')}
            >
              <Input id="parking-opens-at" type="time" {...form.register('opensAt')} />
            </Field>
            <Field
              error={form.formState.errors.closesAt?.message}
              htmlFor="parking-closes-at"
              label={t('parkingForm.closing')}
            >
              <Input id="parking-closes-at" type="time" {...form.register('closesAt')} />
            </Field>
          </div>
        ) : null}
      </fieldset>
      <fieldset className="space-y-5 rounded-[1.5rem] border border-[#121417]/12 bg-[#f5f5f5] p-5 sm:p-6">
        <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
          {t('parkingForm.operations')}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            error={form.formState.errors.capacity?.message}
            htmlFor="parking-capacity"
            label={t('parkingForm.capacity')}
          >
            <Input
              id="parking-capacity"
              min="1"
              type="number"
              {...form.register('capacity', { valueAsNumber: true })}
            />
          </Field>
          <Field
            error={form.formState.errors.hourlyRate?.message}
            htmlFor="parking-rate"
            label={t('parkingForm.hourlyRate', { currency: 'USD' })}
          >
            <Input
              id="parking-rate"
              min="0.01"
              step="0.01"
              type="number"
              {...form.register('hourlyRate', { valueAsNumber: true })}
            />
          </Field>
        </div>
        <Field htmlFor="parking-currency" label={t('parkingForm.currency')}>
          <Select id="parking-currency" {...form.register('currency')}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>
        </Field>
      </fieldset>
      {parking ? (
        <fieldset className="space-y-3 rounded-[1.5rem] border border-[#121417]/12 bg-white p-5 sm:p-6 lg:col-span-2">
          <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
            {t('parkingForm.availability')}
          </legend>
          <Switch
            description={t('parkingForm.acceptCheckInsDescription')}
            id="parking-active"
            label={t('parkingForm.acceptCheckIns')}
            {...form.register('isActive')}
          />
        </fieldset>
      ) : null}
      <fieldset className="space-y-3 rounded-[1.5rem] border border-[#121417]/12 bg-white p-5 sm:p-6 lg:col-span-2">
        <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
          {t('parkingForm.publication')}
        </legend>
        <Switch
          description={t('parkingForm.visibleInDirectoryDescription')}
          id="parking-listed"
          label={t('parkingForm.visibleInDirectory')}
          {...form.register('isListed')}
        />
      </fieldset>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="justify-self-start rounded-full px-6"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting
          ? t('parkingForm.saving')
          : parking
            ? t('parkingForm.saveChanges')
            : t('parkingForm.create')}
      </Button>
    </form>
  );
}
