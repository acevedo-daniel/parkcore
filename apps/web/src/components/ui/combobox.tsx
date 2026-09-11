import { Check, ChevronsUpDown } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { cn } from '../../lib/cn.js';

export interface ComboboxOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface ComboboxProps {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'false' | 'true';
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  emptyLabel?: string;
  id?: string;
  label: string;
  name?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string, option: ComboboxOption) => void;
  options: readonly ComboboxOption[];
  placeholder?: string;
  value?: string;
}

const controlClassName =
  'control parkcore-field flex h-[var(--control-height-md)] w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface-subtle px-3.5 text-left text-sm font-medium text-foreground outline-none transition-colors placeholder:text-foreground-muted focus-within:border-primary focus-within:bg-surface focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-disabled-surface disabled:text-disabled-foreground disabled:opacity-100';

export function Combobox({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className,
  defaultValue,
  disabled = false,
  emptyLabel,
  id,
  label,
  name,
  onChange,
  onValueChange,
  options,
  placeholder,
  value,
}: ComboboxProps) {
  const { t } = useAppearance();
  const generatedId = useId();
  const inputId = id ?? `combobox-${generatedId}`;
  const listboxId = `${inputId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const selectedValue = isControlled ? value : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const [query, setQuery] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [activeValue, setActiveValue] = useState<string | null>(selectedValue || null);
  const inputValue = query ?? selectedOption?.label ?? '';

  const filteredOptions = useMemo(() => {
    const query = inputValue.trim().toLocaleLowerCase();
    if (!query || inputValue === selectedOption?.label) return options;
    return options.filter((option) => option.label.toLocaleLowerCase().includes(query));
  }, [inputValue, options, selectedOption?.label]);

  const enabledOptions = useMemo(
    () => filteredOptions.filter((option) => !option.disabled),
    [filteredOptions],
  );
  const activeOption =
    enabledOptions.length === 0
      ? undefined
      : (enabledOptions.find((option) => option.value === activeValue) ?? enabledOptions[0]);

  const restoreSelection = useCallback(() => {
    setQuery(undefined);
    setActiveValue(selectedValue ? selectedValue : null);
  }, [selectedValue]);

  const close = useCallback(
    (restore = true) => {
      setIsOpen(false);
      if (restore) restoreSelection();
    },
    [restoreSelection],
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [close]);

  const open = () => {
    if (disabled) return;
    setIsOpen(true);
    setActiveValue(selectedValue ? selectedValue : (enabledOptions[0]?.value ?? null));
  };

  const selectOption = (option: ComboboxOption) => {
    if (option.disabled) return;
    if (!isControlled) setInternalValue(option.value);
    setQuery(option.label);
    setActiveValue(option.value);
    setIsOpen(false);
    onChange?.(option.value);
    onValueChange?.(option.value, option);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const moveActive = (direction: 1 | -1, edge?: 'first' | 'last') => {
    if (enabledOptions.length === 0) return;
    const currentIndex = enabledOptions.findIndex(
      (option) => option.value === (activeValue ?? activeOption?.value),
    );
    const nextIndex =
      edge === 'first'
        ? 0
        : edge === 'last'
          ? enabledOptions.length - 1
          : currentIndex < 0
            ? direction === 1
              ? 0
              : enabledOptions.length - 1
            : (currentIndex + direction + enabledOptions.length) % enabledOptions.length;
    setActiveValue(enabledOptions[nextIndex]?.value ?? null);
  };

  return (
    <div className={cn('relative space-y-1.5', className)} data-slot="combobox" ref={rootRef}>
      <label className="field-label block text-xs font-bold text-foreground" htmlFor={inputId}>
        {label}
      </label>
      <div className={cn(controlClassName, disabled && 'opacity-60')}>
        <input
          aria-activedescendant={
            isOpen && activeOption ? `${inputId}-option-${activeOption.value}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={isOpen ? listboxId : undefined}
          aria-describedby={ariaDescribedBy}
          aria-expanded={isOpen}
          aria-invalid={ariaInvalid}
          aria-labelledby={`${inputId}-label`}
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-foreground-muted"
          disabled={disabled}
          id={inputId}
          onBlur={() => {
            window.setTimeout(() => {
              if (!rootRef.current?.contains(document.activeElement)) close();
            }, 0);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveValue(null);
          }}
          onClick={open}
          onFocus={open}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              if (!isOpen) {
                open();
                return;
              }
              moveActive(1);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              if (!isOpen) {
                open();
                return;
              }
              moveActive(-1);
            } else if (event.key === 'Home' && isOpen) {
              event.preventDefault();
              moveActive(1, 'first');
            } else if (event.key === 'End' && isOpen) {
              event.preventDefault();
              moveActive(-1, 'last');
            } else if (event.key === 'Enter' && isOpen && activeOption) {
              event.preventDefault();
              selectOption(activeOption);
            } else if (event.key === 'Escape' && isOpen) {
              event.preventDefault();
              close();
              inputRef.current?.focus();
            } else if (event.key === 'Tab' && isOpen) {
              close();
            }
          }}
          placeholder={placeholder}
          ref={inputRef}
          role="combobox"
          value={inputValue}
        />
        <button
          aria-label={label}
          className="shrink-0 text-foreground-muted outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          disabled={disabled}
          onClick={() => {
            if (isOpen) close(false);
            else open();
            inputRef.current?.focus();
          }}
          tabIndex={-1}
          type="button"
        >
          <ChevronsUpDown aria-hidden="true" className="size-4" />
        </button>
      </div>
      {name ? <input name={name} type="hidden" value={selectedValue} /> : null}
      <span className="visually-hidden" id={`${inputId}-label`}>
        {label}
      </span>
      {isOpen ? (
        <div
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-[var(--radius-md)] border border-border bg-surface-raised p-1 text-sm shadow-overlay"
          id={listboxId}
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-foreground-muted" role="status">
              {emptyLabel ?? t('common.noOptions')}
            </p>
          ) : (
            filteredOptions.map((option) => {
              const optionId = `${inputId}-option-${option.value}`;
              const isActive = option.value === activeOption?.value;
              const isSelected = option.value === selectedValue;
              return (
                <button
                  aria-disabled={option.disabled ? true : undefined}
                  aria-selected={isSelected}
                  className={cn(
                    'flex min-h-10 w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left font-medium text-foreground outline-none transition-colors',
                    isActive && 'bg-surface-hover',
                    isSelected && 'font-bold',
                    option.disabled && 'cursor-not-allowed opacity-50',
                  )}
                  disabled={option.disabled}
                  id={optionId}
                  key={option.value}
                  onClick={() => {
                    selectOption(option);
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  role="option"
                  type="button"
                >
                  <span>{option.label}</span>
                  {isSelected ? <Check aria-hidden="true" className="size-4 text-primary" /> : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
