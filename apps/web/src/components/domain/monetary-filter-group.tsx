import { useRef, useState } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../ui/button.js';
import { Field, Input, Select } from '../ui/field.js';

export type MonetaryCurrency = 'ARS' | 'USD';

interface MonetaryFilterGroupProps {
  className?: string;
  currency?: MonetaryCurrency;
  currencyName?: string;
  defaultMax?: string;
  defaultMin?: string;
  error?: string;
  idPrefix?: string;
  maxName?: string;
  minName?: string;
  onClear?: () => void;
}

export function MonetaryFilterGroup({
  className,
  currency,
  currencyName = 'currency',
  defaultMax = '',
  defaultMin = '',
  error,
  idPrefix = 'monetary',
  maxName = 'maxRate',
  minName = 'minRate',
  onClear,
}: MonetaryFilterGroupProps) {
  const { t } = useAppearance();
  const currencyRef = useRef<HTMLSelectElement>(null);
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);
  const [displayCurrency, setDisplayCurrency] = useState<MonetaryCurrency>(currency ?? 'USD');
  const [hasRate, setHasRate] = useState(Boolean(defaultMin || defaultMax));

  const clear = () => {
    if (currencyRef.current) currencyRef.current.value = '';
    if (minRef.current) minRef.current.value = '';
    if (maxRef.current) maxRef.current.value = '';
    setDisplayCurrency('USD');
    setHasRate(false);
    onClear?.();
  };

  return (
    <fieldset className={className}>
      <legend className="type-label text-foreground-muted">{t('filters.rate')}</legend>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(8rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Field htmlFor={`${idPrefix}-${currencyName}-filter`} label={t('filters.currency')}>
          <Select
            aria-required={hasRate || undefined}
            className="h-12"
            defaultValue={currency ?? ''}
            id={`${idPrefix}-${currencyName}-filter`}
            name={currencyName}
            onChange={(event) => {
              const nextCurrency = event.target.value;
              if (nextCurrency === 'ARS' || nextCurrency === 'USD')
                setDisplayCurrency(nextCurrency);
              else setDisplayCurrency('USD');
            }}
            ref={currencyRef}
            required={hasRate}
          >
            <option value="">{t('filters.allCurrencies')}</option>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>
        </Field>
        <Field
          htmlFor={`${idPrefix}-${minName}-filter`}
          label={t('filters.minRate', { currency: displayCurrency })}
        >
          <Input
            defaultValue={defaultMin}
            id={`${idPrefix}-${minName}-filter`}
            inputMode="decimal"
            min="0.01"
            name={minName}
            onChange={(event) => {
              setHasRate(Boolean(event.target.value.trim() || maxRef.current?.value.trim()));
            }}
            placeholder="0.00"
            ref={minRef}
            step="0.01"
            type="number"
          />
        </Field>
        <Field
          htmlFor={`${idPrefix}-${maxName}-filter`}
          label={t('filters.maxRate', { currency: displayCurrency })}
        >
          <Input
            defaultValue={defaultMax}
            id={`${idPrefix}-${maxName}-filter`}
            inputMode="decimal"
            min="0.01"
            name={maxName}
            onChange={(event) => {
              setHasRate(Boolean(event.target.value.trim() || minRef.current?.value.trim()));
            }}
            placeholder="0.00"
            ref={maxRef}
            step="0.01"
            type="number"
          />
        </Field>
      </div>
      <Button className="mt-3" onClick={clear} size="sm" type="button" variant="ghost">
        {t('filters.clearRate')}
      </Button>
      {error ? (
        <p className="mt-2 text-sm font-medium text-danger-text" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
