import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { CreateParkingRequest, Parking } from '../../lib/api/owner-api.js';
import { Button } from '../../components/ui/button.js';
import { Checkbox, Field, Input, Select, Textarea } from '../../components/ui/field.js';

const parkingFormSchema = z.object({
  address: z.string().trim().min(5, 'Use at least 5 characters.').max(200),
  capacity: z.number().int('Use a whole number.').positive('Capacity must be positive.'),
  description: z.string().trim().max(500, 'Use no more than 500 characters.'),
  hourlyRate: z.number().positive('Hourly rate must be positive.'),
  image: z.union([z.literal(''), z.url('Enter a valid image URL.')]),
  isActive: z.boolean(),
  lat: z.number().min(-90, 'Latitude must be between -90 and 90.').max(90),
  lng: z.number().min(-180, 'Longitude must be between -180 and 180.').max(180),
  title: z.string().trim().min(5, 'Use at least 5 characters.').max(100),
});

type ParkingFormValues = z.infer<typeof parkingFormSchema>;

function defaults(parking?: Parking) {
  return {
    address: parking?.address ?? '',
    capacity: parking?.capacity ?? 1,
    description: parking?.description ?? '',
    hourlyRate: parking ? parking.hourlyRateCents / 100 : 1,
    image: parking?.image ?? '',
    isActive: parking?.isActive ?? true,
    lat: parking?.lat,
    lng: parking?.lng,
    title: parking?.title ?? '',
  };
}

function toRequest(values: ParkingFormValues): CreateParkingRequest {
  return {
    address: values.address,
    capacity: values.capacity,
    currency: 'USD',
    ...(values.description ? { description: values.description } : {}),
    hourlyRateCents: Math.round(values.hourlyRate * 100),
    ...(values.image ? { image: values.image } : {}),
    lat: values.lat,
    lng: values.lng,
    title: values.title,
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
  const form = useForm<ParkingFormValues>({
    defaultValues: defaults(parking),
    resolver: zodResolver(parkingFormSchema),
  });

  const submit = form.handleSubmit(async (values) => {
    await onSubmit({ ...toRequest(values), ...(parking ? { isActive: values.isActive } : {}) });
  });

  return (
    <form
      className="parking-form"
      noValidate
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <fieldset>
        <legend className="type-label">General</legend>
        <Field error={form.formState.errors.title?.message} htmlFor="parking-title" label="Name">
          <Input id="parking-title" {...form.register('title')} />
        </Field>
        <Field
          error={form.formState.errors.description?.message}
          htmlFor="parking-description"
          label="Description"
        >
          <Textarea id="parking-description" rows={4} {...form.register('description')} />
        </Field>
        <Field
          error={form.formState.errors.image?.message}
          htmlFor="parking-image"
          label="Image URL"
        >
          <Input id="parking-image" inputMode="url" type="url" {...form.register('image')} />
        </Field>
      </fieldset>
      <fieldset>
        <legend className="type-label">Location</legend>
        <Field
          error={form.formState.errors.address?.message}
          htmlFor="parking-address"
          label="Address"
        >
          <Input id="parking-address" {...form.register('address')} />
        </Field>
        <div className="form-grid-two">
          <Field error={form.formState.errors.lat?.message} htmlFor="parking-lat" label="Latitude">
            <Input
              id="parking-lat"
              required
              step="any"
              type="number"
              {...form.register('lat', { valueAsNumber: true })}
            />
          </Field>
          <Field error={form.formState.errors.lng?.message} htmlFor="parking-lng" label="Longitude">
            <Input
              id="parking-lng"
              required
              step="any"
              type="number"
              {...form.register('lng', { valueAsNumber: true })}
            />
          </Field>
        </div>
      </fieldset>
      <fieldset>
        <legend className="type-label">Operations</legend>
        <div className="form-grid-two">
          <Field
            error={form.formState.errors.capacity?.message}
            htmlFor="parking-capacity"
            label="Capacity"
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
            label="Hourly rate (USD)"
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
        <Field htmlFor="parking-currency" label="Currency">
          <Select disabled id="parking-currency" value="USD">
            <option value="USD">USD</option>
          </Select>
        </Field>
      </fieldset>
      {parking ? (
        <fieldset>
          <legend className="type-label">Status</legend>
          <Checkbox
            id="parking-active"
            label="Accept new check-ins"
            {...form.register('isActive')}
          />
        </fieldset>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Saving…' : parking ? 'Save changes' : 'Create parking'}
      </Button>
    </form>
  );
}
