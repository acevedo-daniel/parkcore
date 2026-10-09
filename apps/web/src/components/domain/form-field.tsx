import type { ReactNode } from 'react';

import {
  Field,
  FieldControlProvider,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

export interface FormFieldProps {
  children: ReactNode;
  error?: string;
  help?: string;
  htmlFor: string;
  label: string;
}

export function FormField({ children, error, help, htmlFor, label }: FormFieldProps) {
  const describedBy = error ? `${htmlFor}-error` : help ? `${htmlFor}-help` : undefined;

  return (
    <FieldControlProvider value={{ id: htmlFor, describedBy, invalid: Boolean(error) }}>
      <Field className="field space-y-1.5 gap-1.5">
        <FieldLabel
          className="field-label block text-xs font-bold text-foreground"
          htmlFor={htmlFor}
        >
          {label}
        </FieldLabel>
        {children}
        {error ? (
          <FieldError
            className="field-error text-sm font-medium text-destructive-soft-foreground"
            id={describedBy}
          >
            {error}
          </FieldError>
        ) : help ? (
          <FieldDescription
            className="field-help text-sm leading-relaxed text-muted-foreground"
            id={describedBy}
          >
            {help}
          </FieldDescription>
        ) : null}
      </Field>
    </FieldControlProvider>
  );
}
