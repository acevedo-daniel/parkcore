import * as React from 'react';

import { cn } from '../../lib/cn.js';

const controlClassName =
  'control parkcore-field w-full rounded-[var(--radius-md)] border border-border bg-surface-subtle text-sm font-medium text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:bg-surface focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-disabled-surface disabled:text-disabled-foreground disabled:opacity-100';

export interface FieldProps {
  children: React.ReactNode;
  error?: string;
  help?: string;
  htmlFor: string;
  label: string;
}

interface FieldControlProps {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'false' | 'true';
}

export function Field({ children, error, help, htmlFor, label }: FieldProps) {
  const describedBy = error ? `${htmlFor}-error` : help ? `${htmlFor}-help` : undefined;
  const control = React.isValidElement<FieldControlProps>(children)
    ? React.cloneElement(children, {
        'aria-describedby':
          [children.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
        ...(error ? { 'aria-invalid': true } : {}),
      })
    : children;

  return (
    <div className="field space-y-1.5">
      <label className="field-label block text-xs font-bold text-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {control}
      {error ? (
        <p
          className="field-error text-sm font-medium text-danger-text"
          id={describedBy}
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {!error && help ? (
        <p className="field-help text-sm leading-relaxed text-foreground-muted" id={describedBy}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        {...props}
        className={cn(
          `${controlClassName} h-[var(--control-height-md)] px-3.5 py-2 shadow-xs file:border-0 file:bg-transparent file:text-sm file:font-medium`,
          className,
        )}
        data-slot="input"
        ref={ref}
      />
    );
  },
);
Input.displayName = 'Input';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        {...props}
        className={cn(`${controlClassName} min-h-28 resize-y px-3.5 py-3`, className)}
        data-slot="textarea"
        ref={ref}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <select
        {...props}
        className={cn(
          `${controlClassName} h-[var(--control-height-md)] cursor-pointer px-3.5`,
          className,
        )}
        data-slot="select"
        ref={ref}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = 'Select';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, disabled, id, label, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;

    return (
      <label
        className={cn(
          'checkbox flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-subtle px-3.5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        data-slot="checkbox"
        htmlFor={checkboxId}
      >
        <input
          {...props}
          className={cn(
            'checkbox-control size-4 rounded border-border accent-primary focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed',
            className,
          )}
          disabled={disabled}
          id={checkboxId}
          ref={ref}
          type="checkbox"
        />
        <span>{label}</span>
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';
