import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, MapPin, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Combobox } from '../../components/ui/combobox.js';
import { Button } from '../../components/ui/button.js';
import { ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { getPublicParkings, type PublicParking } from '../../lib/api/public-api.js';
import { cn } from '../../lib/cn.js';
import { formatMoney } from '../../lib/format.js';
import type { Locale, MessageKey } from '../../lib/localization.js';

const DURATION_OPTIONS = [
  { hours: 1, label: 'calculator.oneHour' },
  { hours: 2, label: 'calculator.twoHours' },
  { hours: 4, label: 'calculator.fourHours' },
  { hours: 8, label: 'calculator.eightHours' },
] as const satisfies readonly { hours: number; label: MessageKey }[];

export function ParkingCalculatorWidget({ className }: { className?: string }) {
  const { locale, t } = useAppearance();
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
          <p className="type-label text-foreground-muted">{t('calculator.eyebrow')}</p>
          <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.03em]">
            {t('calculator.title')}
          </h2>
        </div>
        <ReceiptText aria-hidden="true" className="mt-1 size-5 text-foreground" />
      </div>

      {parkingsQuery.isLoading ? (
        <CalculatorLoading />
      ) : parkingsQuery.isError ? (
        <ErrorState
          onRetry={() => {
            void parkingsQuery.refetch();
          }}
          title={t('calculator.errorTitle')}
        >
          {t('calculator.errorDescription')}
          <Link
            className="mt-4 inline-flex text-sm font-bold text-foreground underline decoration-accent decoration-2 underline-offset-4"
            to="/parkings"
          >
            {t('calculator.browseAction')}
          </Link>
        </ErrorState>
      ) : availableFacilities.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-subtle p-5">
          <p className="type-label text-foreground-muted">{t('calculator.emptyEyebrow')}</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            {t('calculator.emptyDescription')}
          </p>
          <Link
            className="mt-4 inline-flex text-sm font-bold text-foreground underline decoration-accent decoration-2 underline-offset-4"
            to="/parkings"
          >
            {t('calculator.emptyAction')}
          </Link>
        </div>
      ) : (
        <CalculatorForm
          facilities={availableFacilities}
          locale={locale}
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

function CalculatorLoading() {
  const { t } = useAppearance();
  return (
    <div aria-label={t('calculator.loadingLabel')} aria-live="polite">
      <p className="mb-3 text-sm font-medium text-foreground-secondary">
        {t('calculator.loadingMessage')}
      </p>
      <Skeleton className="h-24 rounded-[var(--radius-lg)]" />
      <Skeleton className="mt-3 h-28 rounded-[var(--radius-lg)]" />
      <Skeleton className="mt-6 h-12 rounded-full" />
    </div>
  );
}

interface CalculatorFormProps {
  locale: Locale;
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
  facilities,
  locale,
  onFacilityChange,
  onHoursChange,
  selectedFacility,
  selectedHours,
  selectedId,
}: CalculatorFormProps) {
  const { t, tPlural } = useAppearance();
  const totalCents = selectedFacility.hourlyRateCents * selectedHours;

  return (
    <>
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface-subtle p-4 transition-colors focus-within:border-primary focus-within:bg-surface">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <MapPin aria-hidden="true" className="size-3.5" />
          </span>
          <Combobox
            className="min-w-0 flex-1"
            id="estimate-facility"
            label={t('calculator.facility')}
            onValueChange={(id) => {
              onFacilityChange(id);
            }}
            options={facilities.map((facility) => ({ label: facility.title, value: facility.id }))}
            value={selectedId}
          />
          <span className="shrink-0 text-right">
            <span className="font-mono text-xs font-bold tabular-nums text-foreground">
              {formatMoney(selectedFacility.hourlyRateCents, selectedFacility.currency, locale)}
            </span>
            <span className="block text-[10px] text-foreground-muted">/ h</span>
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-[var(--radius-lg)] border border-border bg-surface-subtle p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Clock aria-hidden="true" className="size-3.5" />
            {t('calculator.estimatedStay')}
          </span>
          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
            {selectedHours}{' '}
            {tPlural(selectedHours, { one: 'calculator.hour', other: 'calculator.hours' })}
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
              {t(option.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="my-5 px-1 text-xs">
        <div className="flex items-baseline justify-between border-t border-border-subtle pt-4">
          <div>
            <span className="block text-xs font-semibold text-foreground">
              {t('calculator.estimateLabel')}
            </span>
            <span className="text-[11px] text-foreground-muted">
              {t('calculator.estimateBasis')}
            </span>
          </div>
          <span className="font-display text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {formatMoney(totalCents, selectedFacility.currency, locale)}
          </span>
        </div>
      </div>

      <Button asChild className="h-12 w-full rounded-full" size="lg">
        <Link className="group" to={`/parkings/${selectedFacility.id}`}>
          <span>{t('calculator.viewFacility')}</span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-1"
          />
        </Link>
      </Button>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-foreground-muted">
        {t('calculator.estimateNote')}
      </p>
    </>
  );
}
