import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, MapPin, ReceiptText } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Combobox } from '../../components/domain/combobox.js';
import { FormField } from '../../components/domain/form-field.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group.js';
import { EmptyState, ErrorState } from '../../components/domain/feedback.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import { getPublicParkings, type PublicParking } from '../../lib/api/public-api.js';
import { cn } from '../../lib/cn.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import type { Locale, MessageKey } from '../../lib/localization.js';
import { calculateParkingEstimate } from './parking-estimate.js';

const DURATION_OPTIONS = [
  { durationMinutes: 60, id: 'one-hour', label: 'calculator.oneHour' },
  { durationMinutes: 120, id: 'two-hours', label: 'calculator.twoHours' },
  { durationMinutes: 240, id: 'four-hours', label: 'calculator.fourHours' },
  { durationMinutes: 480, id: 'eight-hours', label: 'calculator.eightHours' },
  { durationMinutes: null, id: 'custom', label: 'calculator.custom' },
] as const satisfies readonly {
  durationMinutes: number | null;
  id: string;
  label: MessageKey;
}[];

type DurationOptionId = (typeof DURATION_OPTIONS)[number]['id'];

interface ParkingCalculatorWidgetProps {
  className?: string;
  parking?: PublicParking;
}

export function ParkingCalculatorWidget({ className, parking }: ParkingCalculatorWidgetProps) {
  const { locale, t } = useAppearance();
  const titleId = useId();
  const [selectedId, setSelectedId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<DurationOptionId>('two-hours');

  const parkingsQuery = useQuery({
    enabled: !parking,
    queryKey: ['public-parkings-widget'],
    queryFn: () => getPublicParkings({ limit: 10 }),
    staleTime: 60_000,
  });

  const availableFacilities = useMemo(
    () => (parking ? [parking] : (parkingsQuery.data?.data ?? [])),
    [parking, parkingsQuery.data],
  );
  const selectedFacility =
    parking ??
    availableFacilities.find((facility) => facility.id === selectedId) ??
    availableFacilities[0];

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'relative w-full max-w-[460px] @container rounded-[var(--radius-xl)] border border-border bg-popover p-6 text-foreground shadow-md sm:p-8',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <p className="type-label text-muted-foreground">{t('calculator.eyebrow')}</p>
          <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.03em]" id={titleId}>
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
            className="mt-4 inline-flex min-h-[var(--touch-target-min)] items-center rounded-sm text-sm font-bold text-foreground underline decoration-brand decoration-2 underline-offset-4"
            to="/parkings"
          >
            {t('calculator.browseAction')}
          </Link>
        </ErrorState>
      ) : availableFacilities.length === 0 ? (
        <EmptyState
          action={
            <Link
              className="inline-flex min-h-[var(--touch-target-min)] items-center rounded-sm text-sm font-bold text-foreground underline decoration-brand decoration-2 underline-offset-4"
              to="/parkings"
            >
              {t('calculator.emptyAction')}
            </Link>
          }
          title={t('calculator.emptyEyebrow')}
          variant="compact"
        >
          {t('calculator.emptyDescription')}
        </EmptyState>
      ) : (
        <CalculatorForm
          facilities={availableFacilities}
          locale={locale}
          onFacilityChange={setSelectedId}
          onDurationChange={setSelectedDuration}
          selectedFacility={selectedFacility}
          selectedDuration={selectedDuration}
          selectedId={parking?.id ?? selectedFacility.id}
        />
      )}
    </section>
  );
}

function CalculatorLoading() {
  const { t } = useAppearance();
  return (
    <div
      aria-atomic="true"
      aria-busy="true"
      aria-label={t('calculator.loadingLabel')}
      aria-live="polite"
      role="status"
    >
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
  selectedDuration: DurationOptionId;
  selectedId: string;
  onFacilityChange: (id: string) => void;
  onDurationChange: (duration: DurationOptionId) => void;
}

function CalculatorForm({
  facilities,
  locale,
  onFacilityChange,
  onDurationChange,
  selectedFacility,
  selectedDuration,
  selectedId,
}: CalculatorFormProps) {
  const { t, tPlural } = useAppearance();
  const [customDurationMinutes, setCustomDurationMinutes] = useState('');
  const selectedDurationOption = DURATION_OPTIONS.find((option) => option.id === selectedDuration);
  const parsedCustomDuration = parseCustomDuration(customDurationMinutes);
  const selectedDurationMinutes = selectedDurationOption?.durationMinutes ?? parsedCustomDuration;
  const estimate =
    selectedDurationMinutes === null
      ? null
      : calculateParkingEstimate(selectedDurationMinutes, selectedFacility.hourlyRateCents);
  const customDurationError =
    selectedDuration === 'custom'
      ? customDurationMinutes.trim() === ''
        ? t('calculator.durationRequired')
        : parsedCustomDuration === null
          ? t('calculator.invalidDuration')
          : undefined
      : undefined;
  const durationSummary =
    selectedDuration === 'custom'
      ? parsedCustomDuration === null
        ? t('calculator.durationPending')
        : `${formatNumber(parsedCustomDuration, locale)} ${tPlural(parsedCustomDuration, { one: 'calculator.minute', other: 'calculator.minutes' })}`
      : selectedDurationOption
        ? `${formatNumber((selectedDurationOption.durationMinutes ?? 0) / 60, locale)} ${tPlural((selectedDurationOption.durationMinutes ?? 0) / 60, { one: 'calculator.hour', other: 'calculator.hours' })}`
        : '';

  return (
    <>
      <div className="rounded-[var(--radius-lg)] border border-border bg-muted p-4 transition-colors focus-within:border-primary focus-within:bg-card">
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 @sm:flex @sm:items-center @sm:gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <MapPin aria-hidden="true" className="size-3.5" />
          </span>
          <Combobox
            className="public-discovery-combobox min-w-0 @sm:flex-1"
            id="estimate-facility"
            key={facilities.map((facility) => facility.id).join('|')}
            label={t('calculator.facility')}
            onValueChange={(id) => {
              onFacilityChange(id);
            }}
            options={facilities.map((facility) => ({ label: facility.title, value: facility.id }))}
            value={selectedId}
          />
          <span className="col-start-2 flex items-baseline justify-end gap-1 text-right @sm:block @sm:shrink-0">
            <span className="font-mono text-xs font-bold tabular-nums text-foreground">
              {formatMoney(selectedFacility.hourlyRateCents, selectedFacility.currency, locale)}
            </span>
            <span className="block text-[10px] text-muted-foreground">
              {t('calculator.perHour')}
            </span>
          </span>
        </div>
      </div>

      <fieldset className="mt-3 rounded-[var(--radius-lg)] border border-border bg-muted p-4">
        <legend className="mb-3 flex w-full items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Clock aria-hidden="true" className="size-3.5" />
            {t('calculator.estimatedStay')}
          </span>
          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
            {durationSummary}
          </span>
        </legend>
        <ToggleGroup
          aria-label={t('calculator.estimatedStay')}
          className="grid w-full grid-cols-2 gap-1.5 @sm:grid-cols-5"
          onValueChange={(value) => {
            if (value) onDurationChange(value as (typeof DURATION_OPTIONS)[number]['id']);
          }}
          type="single"
          value={selectedDuration}
          variant="brand"
        >
          {DURATION_OPTIONS.map((option) => (
            <ToggleGroupItem
              className="min-w-0 whitespace-normal rounded-sm border border-border bg-card px-1 py-2 text-center text-xs font-bold leading-tight text-foreground data-[state=on]:border-brand data-[state=on]:text-brand-foreground"
              key={option.id}
              value={option.id}
            >
              {t(option.label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {selectedDuration === 'custom' ? (
          <div className="mt-4 border-t border-border-subtle pt-4">
            <FormField
              error={customDurationError}
              help={customDurationError ? undefined : t('calculator.customDurationHelp')}
              htmlFor="estimate-custom-duration"
              label={t('calculator.customDurationLabel')}
            >
              <Input
                id="estimate-custom-duration"
                inputMode="numeric"
                min={1}
                onChange={(event) => {
                  setCustomDurationMinutes(event.target.value);
                }}
                placeholder={t('calculator.customDurationPlaceholder')}
                step={1}
                type="number"
                value={customDurationMinutes}
              />
            </FormField>
          </div>
        ) : null}
      </fieldset>

      <div className="my-5 px-1 text-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 border-t border-border-subtle pt-4">
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-foreground">
              {t('calculator.estimateLabel')}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {estimate
                ? tPlural(estimate.chargedHours, {
                    one: 'calculator.chargedHour',
                    other: 'calculator.chargedHours',
                  })
                : t('calculator.estimatePending')}
            </span>
          </div>
          <span
            aria-atomic="true"
            aria-live="polite"
            className={cn(
              'max-w-full font-display text-3xl font-bold tracking-tight tabular-nums text-foreground',
              !estimate && 'max-w-40 text-right text-base leading-tight text-foreground-secondary',
            )}
          >
            {estimate
              ? formatMoney(estimate.totalAmountCents, selectedFacility.currency, locale)
              : t('calculator.estimateUnavailable')}
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

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        {t('calculator.estimateNote')}
      </p>
    </>
  );
}

function parseCustomDuration(value: string): number | null {
  if (value.trim() === '') return null;
  const durationMinutes = Number(value);
  return Number.isInteger(durationMinutes) && durationMinutes > 0 ? durationMinutes : null;
}
