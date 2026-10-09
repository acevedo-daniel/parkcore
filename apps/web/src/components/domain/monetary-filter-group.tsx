import { useRef, useState } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../ui/button.js';
import { FormField } from './form-field.js';
import { Input } from '../ui/input.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.js';

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
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);
  const [displayCurrency, setDisplayCurrency] = useState<MonetaryCurrency>(currency ?? 'USD');
  const [filterCurrency, setFilterCurrency] = useState<MonetaryCurrency | 'all'>(currency ?? 'all');
  const [hasRate, setHasRate] = useState(Boolean(defaultMin || defaultMax));

  const clear = () => {
    if (minRef.current) minRef.current.value = '';
    if (maxRef.current) maxRef.current.value = '';
    setDisplayCurrency('USD');
    setFilterCurrency('all');
    setHasRate(false);
    onClear?.();
  };

  return (
    <fieldset className={className}>
      <legend className="type-label text-muted-foreground">{t('filters.rate')}</legend>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(8rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <FormField htmlFor={`${idPrefix}-${currencyName}-filter`} label={t('filters.currency')}>
          <Select
            name={currencyName}
            onValueChange={(nextCurrency) => {
              if (nextCurrency === 'ARS' || nextCurrency === 'USD') {
                setDisplayCurrency(nextCurrency);
                setFilterCurrency(nextCurrency);
              } else {
                setDisplayCurrency('USD');
                setFilterCurrency('all');
              }
            }}
            value={filterCurrency}
            required={hasRate}
          >
            <SelectTrigger
              aria-required={hasRate || undefined}
              id={`${idPrefix}-${currencyName}-filter`}
              className="min-h-12"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allCurrencies')}</SelectItem>
              <SelectItem value="ARS">ARS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField
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
        </FormField>
        <FormField
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
        </FormField>
      </div>
      <Button className="mt-3" onClick={clear} size="sm" type="button" variant="ghost">
        {t('filters.clearRate')}
      </Button>
      {error ? (
        <p className="mt-2 text-sm font-medium text-destructive-soft-foreground" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
