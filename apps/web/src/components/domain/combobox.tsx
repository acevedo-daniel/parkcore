import { Check, ChevronsUpDown } from 'lucide-react';
import { forwardRef, useId, useState, type FocusEventHandler } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { useFieldControlProps } from '../../lib/field-control-context.js';
import { Button } from '../ui/button.js';
import { HiddenInput } from '../ui/input.js';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../ui/command.js';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.js';
import { cn } from '../../lib/cn.js';

export interface ComboboxOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface ComboboxProps {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'false' | 'true';
  'aria-required'?: boolean | 'false' | 'true';
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  emptyLabel?: string;
  id?: string;
  label: string;
  name?: string;
  onChange?: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  onValueChange?: (value: string, option: ComboboxOption) => void;
  options: readonly ComboboxOption[];
  placeholder?: string;
  value?: string;
}

export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(function Combobox(
  {
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    className,
    defaultValue,
    disabled = false,
    emptyLabel,
    id,
    label,
    name,
    onChange,
    onBlur,
    onValueChange,
    options,
    placeholder,
    value,
  },
  forwardedRef,
) {
  const { t } = useAppearance();
  const generatedId = useId();
  const inputId = id ?? `combobox-${generatedId}`;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [query, setQuery] = useState('');
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const fieldProps = useFieldControlProps({
    id: inputId,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
  });

  const selectOption = (nextValue: string) => {
    const option = options.find((item) => item.value === nextValue);
    if (!option || option.disabled) return;
    if (value === undefined) setInternalValue(option.value);
    setQuery('');
    setOpen(false);
    onChange?.(option.value);
    onValueChange?.(option.value, option);
  };

  return (
    <div className={cn('space-y-1.5', className)} data-slot="combobox">
      <label
        className="field-label block text-xs font-bold text-foreground"
        htmlFor={fieldProps.id}
      >
        {label}
      </label>
      <Popover
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setQuery('');
        }}
        open={open}
      >
        <PopoverTrigger asChild>
          <Button
            aria-describedby={fieldProps['aria-describedby']}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-invalid={fieldProps['aria-invalid']}
            aria-label={label}
            aria-required={ariaRequired === true || ariaRequired === 'true' || undefined}
            className={cn(
              'justify-between border-input bg-muted text-left font-medium hover:bg-muted',
              !selectedOption && 'text-muted-foreground',
            )}
            disabled={disabled}
            id={fieldProps.id}
            onBlur={onBlur}
            ref={forwardedRef}
            role="combobox"
            variant="outline"
          >
            <span className="truncate">{selectedOption?.label ?? placeholder ?? label}</span>
            <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <Command label={label}>
            <CommandInput
              aria-label={label}
              onValueChange={setQuery}
              placeholder={placeholder ?? label}
              value={query}
            />
            <CommandList>
              <CommandEmpty>{emptyLabel ?? t('common.noOptions')}</CommandEmpty>
              {options.map((option) => (
                <CommandItem
                  disabled={option.disabled}
                  key={option.value}
                  keywords={[option.label]}
                  onSelect={() => {
                    selectOption(option.value);
                  }}
                  value={option.value}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === selectedValue ? (
                    <Check aria-hidden="true" className="ml-auto size-4 text-primary" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {name ? <HiddenInput name={name} value={selectedValue} /> : null}
    </div>
  );
});

Combobox.displayName = 'Combobox';
