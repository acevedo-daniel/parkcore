import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, MapPin, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { Select } from '../../components/ui/field.js';
import { getPublicParkings, type PublicParking } from '../../lib/api/public-api.js';
import { cn } from '../../lib/cn.js';
import { formatMoney } from '../../lib/format.js';

const DURATION_OPTIONS = [
  { hours: 1, labelEs: '1 hora', labelEn: '1 hour' },
  { hours: 2, labelEs: '2 horas', labelEn: '2 hours' },
  { hours: 4, labelEs: '4 horas', labelEn: '4 hours' },
  { hours: 8, labelEs: '8 horas', labelEn: '8 hours' },
];

export function ParkingCalculatorWidget({ className }: { className?: string }) {
  const { language } = useAppearance();
  const es = language === 'es';
  const [selectedId, setSelectedId] = useState('');
  const [selectedHours, setSelectedHours] = useState(2);

  const parkingsQuery = useQuery({
    queryKey: ['public-parkings-widget'],
    queryFn: () => getPublicParkings({ limit: 10 }),
    staleTime: 60_000,
  });

  const availableFacilities = useMemo(() => parkingsQuery.data?.data ?? [], [parkingsQuery.data]);
  const selectedFacility =
    availableFacilities.find((facility) => facility.id === selectedId) ?? availableFacilities[0];

  return (
    <div
      className={cn(
        'relative w-full max-w-[460px] rounded-[var(--radius-xl)] border border-border bg-surface-raised p-6 text-foreground shadow-hover sm:p-8',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <p className="type-label text-foreground-muted">
            {es ? 'Antes de salir' : 'Before you go'}
          </p>
          <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.03em]">
            {es ? 'Calculá una estadía' : 'Estimate a stay'}
          </h2>
        </div>
        <ReceiptText aria-hidden="true" className="mt-1 size-5 text-foreground" />
      </div>

      {parkingsQuery.isLoading ? (
        <CalculatorLoading es={es} />
      ) : parkingsQuery.isError ? (
        <ErrorState
          onRetry={() => {
            void parkingsQuery.refetch();
          }}
          title={es ? 'No pudimos cargar las cocheras' : 'We could not load facilities'}
        >
          {es
            ? 'La estimación necesita una tarifa publicada. Probá de nuevo o explorá el directorio.'
            : 'The estimate needs a published rate. Try again or explore the directory.'}
          <Link
            className="mt-4 inline-flex text-sm font-bold text-foreground underline decoration-accent decoration-2 underline-offset-4"
            to="/parkings"
          >
            {es ? 'Explorar cocheras' : 'Browse facilities'}
          </Link>
        </ErrorState>
      ) : availableFacilities.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-subtle p-5">
          <p className="type-label text-foreground-muted">
            {es ? 'Sin cocheras disponibles' : 'No facilities available'}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            {es
              ? 'Todavía no hay una cochera activa para estimar. Podés revisar el directorio más tarde.'
              : 'There is no active facility to estimate yet. You can check the directory again later.'}
          </p>
          <Link
            className="mt-4 inline-flex text-sm font-bold text-foreground underline decoration-accent decoration-2 underline-offset-4"
            to="/parkings"
          >
            {es ? 'Ver el directorio' : 'View the directory'}
          </Link>
        </div>
      ) : (
        <CalculatorForm
          es={es}
          facilities={availableFacilities}
          onFacilityChange={setSelectedId}
          onHoursChange={setSelectedHours}
          selectedFacility={selectedFacility}
          selectedHours={selectedHours}
          selectedId={selectedFacility.id}
        />
      )}
    </div>
  );
}

function CalculatorLoading({ es }: { es: boolean }) {
  return (
    <div aria-label={es ? 'Cargando cocheras' : 'Loading facilities'} aria-live="polite">
      <p className="mb-3 text-sm font-medium text-foreground-secondary">
        {es ? 'Buscando cocheras activas…' : 'Finding active facilities…'}
      </p>
      <Skeleton className="h-24 rounded-[var(--radius-lg)]" />
      <Skeleton className="mt-3 h-28 rounded-[var(--radius-lg)]" />
      <Skeleton className="mt-6 h-12 rounded-full" />
    </div>
  );
}

interface CalculatorFormProps {
  es: boolean;
  facilities: {
    id: string;
    title: string;
    hourlyRateCents: number;
    currency: PublicParking['currency'];
  }[];
  selectedFacility: {
    id: string;
    title: string;
    hourlyRateCents: number;
    currency: PublicParking['currency'];
  };
  selectedHours: number;
  selectedId: string;
  onFacilityChange: (id: string) => void;
  onHoursChange: (hours: number) => void;
}

function CalculatorForm({
  es,
  facilities,
  onFacilityChange,
  onHoursChange,
  selectedFacility,
  selectedHours,
  selectedId,
}: CalculatorFormProps) {
  const totalCents = selectedFacility.hourlyRateCents * selectedHours;

  return (
    <>
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface-subtle p-4 transition-colors focus-within:border-primary focus-within:bg-surface">
        <label className="mb-2 block text-xs font-bold text-foreground" htmlFor="estimate-facility">
          {es ? '¿A qué cochera vas?' : 'Where are you parking?'}
        </label>
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <MapPin aria-hidden="true" className="size-3.5" />
          </span>
          <Select
            aria-label={es ? 'Elegir cochera' : 'Choose facility'}
            className="h-10 min-w-0 flex-1 border-0 bg-transparent px-0 font-display text-base font-bold focus:bg-transparent"
            id="estimate-facility"
            onChange={(event) => {
              onFacilityChange(event.target.value);
            }}
            value={selectedId}
          >
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.title}
              </option>
            ))}
          </Select>
          <span className="shrink-0 text-right">
            <span className="font-mono text-xs font-bold tabular-nums text-foreground">
              {formatMoney(selectedFacility.hourlyRateCents, selectedFacility.currency)}
            </span>
            <span className="block text-[10px] text-foreground-muted">/ h</span>
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-[var(--radius-lg)] border border-border bg-surface-subtle p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Clock aria-hidden="true" className="size-3.5" />
            {es ? 'Estadía estimada' : 'Estimated stay'}
          </span>
          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
            {selectedHours} {selectedHours === 1 ? (es ? 'hora' : 'hour') : es ? 'horas' : 'hours'}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {DURATION_OPTIONS.map((option) => (
            <button
              className={cn(
                'min-h-10 cursor-pointer rounded-[var(--radius-sm)] px-1 py-2 text-center text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                selectedHours === option.hours
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-foreground hover:bg-accent hover:text-accent-foreground',
              )}
              key={option.hours}
              onClick={() => {
                onHoursChange(option.hours);
              }}
              type="button"
            >
              {es ? option.labelEs : option.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="my-5 px-1 text-xs">
        <div className="flex items-baseline justify-between border-t border-border-subtle pt-4">
          <div>
            <span className="block text-xs font-semibold text-foreground">
              {es ? 'Presupuesto orientativo' : 'A simple estimate'}
            </span>
            <span className="text-[11px] text-foreground-muted">
              {es ? 'Según tarifa publicada' : 'Based on the published rate'}
            </span>
          </div>
          <span className="font-display text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {formatMoney(totalCents, selectedFacility.currency)}
          </span>
        </div>
      </div>

      <Button asChild className="h-12 w-full rounded-full" size="lg">
        <Link className="group" to={`/parkings/${selectedFacility.id}`}>
          <span>{es ? 'Ver la cochera' : 'View this facility'}</span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-1"
          />
        </Link>
      </Button>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-foreground-muted">
        {es
          ? 'Es una estimación: confirmá los detalles de la cochera antes de llegar.'
          : 'This is an estimate: confirm facility details before arriving.'}
      </p>
    </>
  );
}
