import * as React from 'react';
import { cn } from '@/lib/cn';
import { useFieldControlProps } from '@/lib/field-control-context';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  const fieldProps = useFieldControlProps(props);

  return (
    <input
      {...props}
      {...fieldProps}
      type={type}
      className={cn(
        'control min-h-11 w-full min-w-0 rounded-md border border-input bg-muted px-3.5 py-2 text-sm font-medium text-foreground shadow-xs outline-none transition-control placeholder:text-muted-foreground focus:border-primary focus:bg-card disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      data-slot="input"
    />
  );
}

function HiddenInput(props: React.ComponentProps<'input'>) {
  return <input {...props} type="hidden" />;
}

export { HiddenInput, Input };
