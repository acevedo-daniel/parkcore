import type {
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cloneElement, isValidElement } from 'react';

import { cn } from '../../lib/cn.js';

interface FieldProps {
  children: ReactNode;
  error?: string;
  help?: string;
  htmlFor: string;
  label: string;
}

export function Field({ children, error, help, htmlFor, label }: FieldProps) {
  const describedBy = error ? `${htmlFor}-error` : help ? `${htmlFor}-help` : undefined;
  const control = isValidElement<{
    'aria-describedby'?: string;
    'aria-invalid'?: boolean | 'false' | 'true';
  }>(children)
    ? cloneElement(
        children as ReactElement<{
          'aria-describedby'?: string;
          'aria-invalid'?: boolean | 'false' | 'true';
        }>,
        {
          'aria-describedby':
            [children.props['aria-describedby'], describedBy].filter(Boolean).join(' ') ||
            undefined,
          ...(error ? { 'aria-invalid': true } : {}),
        },
      )
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

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'control parkcore-field h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface-subtle px-3.5 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:bg-surface focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-disabled-surface disabled:text-disabled-foreground disabled:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'control parkcore-field min-h-28 w-full resize-y rounded-[var(--radius-md)] border border-border bg-surface-subtle px-3.5 py-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:bg-surface focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-disabled-surface disabled:text-disabled-foreground disabled:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ children, className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'control parkcore-field h-11 w-full cursor-pointer rounded-[var(--radius-md)] border border-border bg-surface-subtle px-3.5 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:bg-surface focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-disabled-surface disabled:text-disabled-foreground disabled:opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ className, id, label, ...props }: CheckboxProps) {
  const checkboxId = id ?? `checkbox-${label.replaceAll(/\s+/g, '-').toLowerCase()}`;
  return (
    <label
      className="checkbox flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-subtle px-3.5 py-3 text-sm font-semibold text-foreground"
      htmlFor={checkboxId}
    >
      <input
        className={cn('checkbox-control size-4 accent-primary', className)}
        id={checkboxId}
        type="checkbox"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
