import type { ReactNode } from 'react';

import { FieldControlProvider } from '../../lib/field-control-provider.js';
import { Label } from '../ui/label.js';

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
      <div className="field space-y-1.5 gap-1.5" data-slot="field" role="group">
        <Label className="field-label block text-xs font-bold text-foreground" htmlFor={htmlFor}>
          {label}
        </Label>
        {children}
        {error ? (
          <div
            className="field-error text-sm font-medium text-destructive-soft-foreground"
            data-slot="field-error"
            id={describedBy}
            role="alert"
          >
            {error}
          </div>
        ) : help ? (
          <p
            className="field-help text-sm leading-relaxed text-muted-foreground"
            data-slot="field-description"
            id={describedBy}
          >
            {help}
          </p>
        ) : null}
      </div>
    </FieldControlProvider>
  );
}
