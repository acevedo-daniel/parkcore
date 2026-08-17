import type { components } from '@parkcore/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../ui/button.js';
import { Field, Input, Select, Textarea } from '../ui/field.js';

const normalizePlate = (plate: string) =>
  plate
    .trim()
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]/g, '');

const checkInFormSchema = z.object({
  brand: z.string().trim().max(50, 'Use no more than 50 characters.'),
  customerName: z.string().trim().max(100, 'Use no more than 100 characters.'),
  customerPhone: z.string().trim().max(20, 'Use no more than 20 characters.'),
  model: z.string().trim().max(50, 'Use no more than 50 characters.'),
  notes: z.string().trim().max(500, 'Use no more than 500 characters.'),
  plate: z
    .string()
    .transform(normalizePlate)
    .pipe(
      z
        .string()
        .min(1, 'Enter a vehicle plate.')
        .min(4, 'Use 4 to 10 alphanumeric characters.')
        .max(10, 'Use 4 to 10 alphanumeric characters.'),
    ),
  type: z.enum(['CAR', 'MOTORCYCLE', 'LARGE']),
});

type CheckInForm = z.infer<typeof checkInFormSchema>;
type CheckInRequest = components['schemas']['CheckInRequest'];

export function CheckInPanel({
  error,
  isSubmitting,
  onSubmit,
}: {
  error?: string;
  isSubmitting?: boolean;
  onSubmit: (input: CheckInRequest) => void | Promise<void>;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CheckInForm>({
    defaultValues: {
      brand: '',
      customerName: '',
      customerPhone: '',
      model: '',
      notes: '',
      plate: '',
      type: 'CAR',
    },
    resolver: zodResolver(checkInFormSchema),
  });

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
    <form className="check-in-panel" noValidate onSubmit={onFormSubmit}>
      <Field error={errors.plate?.message} htmlFor="check-in-plate" label="Plate">
        <Input
          id="check-in-plate"
          autoComplete="off"
          placeholder="AB123CD"
          {...register('plate')}
        />
      </Field>
      <p className="field-help">
        Plates are normalized. Known vehicles are reused within this parking.
      </p>
      <div className="form-divider">
        <span className="type-label">Vehicle</span>
      </div>
      <Field error={errors.type?.message} htmlFor="check-in-type" label="Type">
        <Select id="check-in-type" {...register('type')}>
          <option value="CAR">Car</option>
          <option value="MOTORCYCLE">Motorcycle</option>
          <option value="LARGE">Large vehicle</option>
        </Select>
      </Field>
      <Field htmlFor="check-in-brand" label="Brand">
        <Input id="check-in-brand" {...register('brand')} />
      </Field>
      <Field htmlFor="check-in-model" label="Model">
        <Input id="check-in-model" {...register('model')} />
      </Field>
      <div className="form-divider">
        <span className="type-label">Visitor · optional</span>
      </div>
      <Field htmlFor="check-in-name" label="Name">
        <Input id="check-in-name" {...register('customerName')} />
      </Field>
      <Field htmlFor="check-in-phone" label="Phone">
        <Input id="check-in-phone" inputMode="tel" {...register('customerPhone')} />
      </Field>
      <Field htmlFor="check-in-notes" label="Notes">
        <Textarea id="check-in-notes" {...register('notes')} />
      </Field>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button disabled={isSubmitting} fullWidth type="submit">
        {isSubmitting ? 'Starting session…' : 'Start session'}
      </Button>
    </form>
  );
}
