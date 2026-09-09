import * as React from 'react';

import { cn } from '../../lib/cn.js';

export type InputProps = React.ComponentProps<'input'>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        ref={ref}
        className={cn(
          'parkcore-field border-border bg-surface text-foreground placeholder:text-foreground-muted focus-visible:border-primary flex h-[var(--control-height-md)] w-full rounded-[var(--radius-sm)] border px-3.5 py-2 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 outline-none',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
