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
      <label className="field-label block text-xs font-bold text-[#121417]" htmlFor={htmlFor}>
        {label}
      </label>
      {control}
      {error ? (
        <p className="field-error text-sm font-medium text-[#b42318]" id={describedBy} role="alert">
          {error}
        </p>
      ) : null}
      {!error && help ? (
        <p className="field-help text-sm leading-relaxed text-[#6d695f]" id={describedBy}>
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
        'control parkcore-field h-11 w-full rounded-xl border border-[#121417]/12 bg-[#f5f5f5] px-3.5 text-sm font-medium text-[#121417] outline-none transition-colors placeholder:text-[#8b877d] focus:border-[#121417] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60',
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
        'control parkcore-field min-h-28 w-full resize-y rounded-xl border border-[#121417]/12 bg-[#f5f5f5] px-3.5 py-3 text-sm font-medium text-[#121417] outline-none transition-colors placeholder:text-[#8b877d] focus:border-[#121417] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60',
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
        'control parkcore-field h-11 w-full cursor-pointer rounded-xl border border-[#121417]/12 bg-[#f5f5f5] px-3.5 text-sm font-medium text-[#121417] outline-none transition-colors focus:border-[#121417] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60',
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
      className="checkbox flex cursor-pointer items-center gap-3 rounded-xl border border-[#121417]/10 bg-[#f5f5f5] px-3.5 py-3 text-sm font-semibold text-[#121417]"
      htmlFor={checkboxId}
    >
      <input
        className={cn('checkbox-control size-4 accent-[#121417]', className)}
        id={checkboxId}
        type="checkbox"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
