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
    ? cloneElement(children as ReactElement<{
        'aria-describedby'?: string;
        'aria-invalid'?: boolean | 'false' | 'true';
      }>, {
        'aria-describedby': [children.props['aria-describedby'], describedBy]
          .filter(Boolean)
          .join(' ') || undefined,
        ...(error ? { 'aria-invalid': true } : {}),
      })
    : children;

  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {control}
      {error ? (
        <p className="field-error" id={describedBy} role="alert">
          {error}
        </p>
      ) : null}
      {!error && help ? (
        <p className="field-help" id={describedBy}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('control', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('control', className)} {...props} />;
}

export function Select({ children, className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('control', className)} {...props}>
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
    <label className="checkbox" htmlFor={checkboxId}>
      <input
        className={cn('checkbox-control', className)}
        id={checkboxId}
        type="checkbox"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
