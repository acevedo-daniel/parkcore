import type { components } from '@parkcore/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAppearance } from '../../app/appearance-provider.js';
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

const controlClassName =
  'block h-12 w-full rounded-xl border border-[#121417] bg-white px-3 text-[#121417] shadow-none focus:border-[#121417] focus:ring-2 focus:ring-[#ffcc00]';

export function CheckInPanel({
  error,
  isSubmitting,
  onSubmit,
}: {
  error?: string;
  isSubmitting?: boolean;
  onSubmit: (input: CheckInRequest) => void | Promise<void>;
}) {
  const { language } = useAppearance();
  const es = language === 'es';
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
    <form className="space-y-5 pt-6" noValidate onSubmit={onFormSubmit}>
      <Field
        error={errors.plate?.message}
        htmlFor="check-in-plate"
        label={es ? 'Patente' : 'Plate'}
      >
        <Input
          autoComplete="off"
          className={`${controlClassName} font-mono font-bold tracking-[0.12em]`}
          id="check-in-plate"
          placeholder="AB123CD"
          {...register('plate')}
        />
      </Field>
      <p className="text-sm leading-relaxed text-[#45423c]">
        {es
          ? 'La patente se normaliza. Los vehículos conocidos se reutilizan dentro de esta cochera.'
          : 'Plates are normalized. Known vehicles are reused within this parking.'}
      </p>

      <FormDivider label={es ? 'Vehículo' : 'Vehicle'} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field error={errors.type?.message} htmlFor="check-in-type" label={es ? 'Tipo' : 'Type'}>
          <Select className={controlClassName} id="check-in-type" {...register('type')}>
            <option value="CAR">{es ? 'Auto' : 'Car'}</option>
            <option value="MOTORCYCLE">{es ? 'Moto' : 'Motorcycle'}</option>
            <option value="LARGE">{es ? 'Vehículo grande' : 'Large vehicle'}</option>
          </Select>
        </Field>
        <Field htmlFor="check-in-brand" label={es ? 'Marca' : 'Brand'}>
          <Input className={controlClassName} id="check-in-brand" {...register('brand')} />
        </Field>
      </div>
      <Field htmlFor="check-in-model" label={es ? 'Modelo' : 'Model'}>
        <Input className={controlClassName} id="check-in-model" {...register('model')} />
      </Field>

      <FormDivider label={es ? 'Visitante · opcional' : 'Visitor · optional'} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field htmlFor="check-in-name" label={es ? 'Nombre' : 'Name'}>
          <Input className={controlClassName} id="check-in-name" {...register('customerName')} />
        </Field>
        <Field htmlFor="check-in-phone" label={es ? 'Teléfono' : 'Phone'}>
          <Input
            className={controlClassName}
            id="check-in-phone"
            inputMode="tel"
            {...register('customerPhone')}
          />
        </Field>
      </div>
      <Field htmlFor="check-in-notes" label={es ? 'Notas' : 'Notes'}>
        <Textarea
          className="block min-h-24 w-full rounded-xl border border-[#121417] bg-white px-3 py-2 text-[#121417] shadow-none focus:border-[#121417] focus:ring-2 focus:ring-[#ffcc00]"
          id="check-in-notes"
          {...register('notes')}
        />
      </Field>

      {error ? (
        <p
          className="border border-[#121417] bg-[#ffcc00] p-3 text-sm font-semibold text-[#121417]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Button
        className="border-[#121417] bg-[#121417] text-white hover:bg-[#30312d]"
        disabled={isSubmitting}
        fullWidth
        type="submit"
      >
        {isSubmitting
          ? es
            ? 'Iniciando estadía…'
            : 'Starting session…'
          : es
            ? 'Iniciar estadía'
            : 'Start session'}
      </Button>
    </form>
  );
}

function FormDivider({ label }: { label: string }) {
  return (
    <div className="border-t border-[#121417]/20 pt-5">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#6d695f]">
        {label}
      </span>
    </div>
  );
}
