import * as React from 'react';

import { cn } from '../../lib/cn.js';

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'children' | 'type'
> {
  description?: React.ReactNode;
  label: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, description, disabled, id, label, ...props }, ref) => {
    const { onKeyDown, ...inputProps } = props;
    const generatedId = React.useId();
    const switchId = id ?? generatedId;
    const labelId = `${switchId}-label`;
    const descriptionId = description ? `${switchId}-description` : undefined;
    const describedBy =
      [props['aria-describedby'], descriptionId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="space-y-2" data-slot="switch">
        <label
          className={cn(
            'group flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-subtle px-3.5 py-3 text-sm text-foreground transition-colors hover:bg-surface-hover',
            disabled && 'cursor-not-allowed opacity-60',
          )}
          htmlFor={switchId}
        >
          <input
            {...inputProps}
            aria-describedby={describedBy}
            aria-labelledby={labelId}
            className={cn('peer visually-hidden', className)}
            disabled={disabled}
            id={switchId}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented || disabled) return;
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
            ref={ref}
            role="switch"
            type="checkbox"
          />
          <span
            aria-hidden="true"
            className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full border border-border-strong bg-surface-emphasis p-0.5 transition-colors peer-checked:border-primary peer-checked:bg-primary peer-disabled:opacity-60 peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring"
          >
            <span className="block size-5 rounded-full bg-foreground-muted shadow-xs transition-transform peer-checked:translate-x-5 peer-checked:bg-primary-foreground" />
          </span>
          <span className="min-w-0 font-semibold" id={labelId}>
            {label}
          </span>
        </label>
        {description ? (
          <p className="pl-14 text-sm leading-relaxed text-foreground-muted" id={descriptionId}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);
Switch.displayName = 'Switch';
