import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAppearance } from '../../app/appearance-provider.js';
import type { CreateParkingRequest, Parking } from '../../lib/api/owner-api.js';
import { Button } from '../../components/ui/button.js';
import { Checkbox, Field, Input, Select, Textarea } from '../../components/ui/field.js';

const parkingFormSchema = z
  .object({
    address: z.string().trim().min(5, 'Use at least 5 characters.').max(200),
    capacity: z.number().int('Use a whole number.').positive('Capacity must be positive.'),
    closesAt: z.string(),
    currency: z.enum(['ARS', 'USD']),
    description: z.string().trim().max(500, 'Use no more than 500 characters.'),
    hourlyRate: z.number().positive('Hourly rate must be positive.'),
    image: z.union([z.literal(''), z.url('Enter a valid image URL.')]),
    isActive: z.boolean(),
    is24Hours: z.boolean(),
    isListed: z.boolean(),
    lat: z.number().min(-90, 'Latitude must be between -90 and 90.').max(90),
    lng: z.number().min(-180, 'Longitude must be between -180 and 180.').max(180),
    neighborhood: z.string().trim().min(2, 'Use at least 2 characters.').max(100),
    opensAt: z.string(),
    title: z.string().trim().min(5, 'Use at least 5 characters.').max(100),
    timezone: z.string().trim().min(1, 'Timezone is required.'),
  })
  .superRefine((values, context) => {
    if (values.is24Hours) return;
    if (!values.opensAt || !values.closesAt) {
      context.addIssue({
        code: 'custom',
        path: ['opensAt'],
        message: 'Set opening and closing times.',
      });
      return;
    }
    if (values.opensAt === values.closesAt) {
      context.addIssue({ code: 'custom', path: ['closesAt'], message: 'Times cannot be equal.' });
    }
  });

type ParkingFormValues = z.infer<typeof parkingFormSchema>;

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
  const { language } = useAppearance();
  const es = language === 'es';
  const form = useForm<ParkingFormValues>({
    defaultValues: defaults(parking),
    resolver: zodResolver(parkingFormSchema),
  });

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
          {es ? 'Información general' : 'General information'}
        </legend>
        <Field
          error={form.formState.errors.title?.message}
          htmlFor="parking-title"
          label={es ? 'Nombre' : 'Name'}
        >
          <Input id="parking-title" {...form.register('title')} />
        </Field>
        <Field
          error={form.formState.errors.neighborhood?.message}
          htmlFor="parking-neighborhood"
          label={es ? 'Barrio' : 'Neighborhood'}
        >
          <Input id="parking-neighborhood" {...form.register('neighborhood')} />
        </Field>
        <Field
          error={form.formState.errors.description?.message}
          htmlFor="parking-description"
          label={es ? 'Descripción' : 'Description'}
        >
          <Textarea id="parking-description" rows={4} {...form.register('description')} />
        </Field>
        <Field
          error={form.formState.errors.image?.message}
          htmlFor="parking-image"
          label={es ? 'URL de imagen' : 'Image URL'}
        >
          <Input id="parking-image" inputMode="url" type="url" {...form.register('image')} />
        </Field>
      </fieldset>
      <fieldset className="space-y-5 rounded-[1.5rem] border border-[#121417]/12 bg-white p-5 sm:p-6">
        <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
          {es ? 'Ubicación' : 'Location'}
        </legend>
        <Field
          error={form.formState.errors.address?.message}
          htmlFor="parking-address"
          label={es ? 'Dirección' : 'Address'}
        >
          <Input id="parking-address" {...form.register('address')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            error={form.formState.errors.lat?.message}
            htmlFor="parking-lat"
            label={es ? 'Latitud' : 'Latitude'}
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
            label={es ? 'Longitud' : 'Longitude'}
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
          label={es ? 'Zona horaria' : 'Timezone'}
        >
          <Input id="parking-timezone" {...form.register('timezone')} />
        </Field>
      </fieldset>
      <fieldset className="space-y-5 rounded-[1.5rem] border border-[#121417]/12 bg-white p-5 sm:p-6">
        <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
          {es ? 'Horarios' : 'Hours'}
        </legend>
        <Checkbox
          id="parking-24-hours"
          label={es ? 'Abierta las 24 horas' : 'Open 24 hours'}
          {...form.register('is24Hours')}
        />
        {!form.watch('is24Hours') ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              error={form.formState.errors.opensAt?.message}
              htmlFor="parking-opens-at"
              label={es ? 'Apertura' : 'Opening'}
            >
              <Input id="parking-opens-at" type="time" {...form.register('opensAt')} />
            </Field>
            <Field
              error={form.formState.errors.closesAt?.message}
              htmlFor="parking-closes-at"
              label={es ? 'Cierre' : 'Closing'}
            >
              <Input id="parking-closes-at" type="time" {...form.register('closesAt')} />
            </Field>
          </div>
        ) : null}
      </fieldset>
      <fieldset className="space-y-5 rounded-[1.5rem] border border-[#121417]/12 bg-[#f5f5f5] p-5 sm:p-6">
        <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
          {es ? 'Operación' : 'Operations'}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            error={form.formState.errors.capacity?.message}
            htmlFor="parking-capacity"
            label={es ? 'Capacidad' : 'Capacity'}
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
            label={es ? 'Tarifa por hora (USD)' : 'Hourly rate (USD)'}
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
        <Field htmlFor="parking-currency" label={es ? 'Moneda' : 'Currency'}>
          <Select id="parking-currency" {...form.register('currency')}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>
        </Field>
      </fieldset>
      {parking ? (
        <fieldset className="space-y-3 rounded-[1.5rem] border border-[#121417]/12 bg-white p-5 sm:p-6 lg:col-span-2">
          <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
            {es ? 'Disponibilidad' : 'Availability'}
          </legend>
          <Checkbox
            id="parking-active"
            label={es ? 'Aceptar nuevos ingresos' : 'Accept new check-ins'}
            {...form.register('isActive')}
          />
        </fieldset>
      ) : null}
      <fieldset className="space-y-3 rounded-[1.5rem] border border-[#121417]/12 bg-white p-5 sm:p-6 lg:col-span-2">
        <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
          {es ? 'Publicación' : 'Publication'}
        </legend>
        <Checkbox
          id="parking-listed"
          label={es ? 'Visible en el directorio' : 'Visible in directory'}
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
          ? es
            ? 'Guardando…'
            : 'Saving…'
          : parking
            ? es
              ? 'Guardar cambios'
              : 'Save changes'
            : es
              ? 'Crear cochera'
              : 'Create parking'}
      </Button>
    </form>
  );
}
