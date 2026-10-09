import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn.js';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-xs',
        secondary: 'border-border bg-muted text-foreground border shadow-xs',
        destructive:
          'bg-destructive-soft text-destructive-soft-foreground border border-destructive/25',
        danger: 'bg-destructive-soft text-destructive-soft-foreground border border-destructive/25',
        success: 'bg-success-soft text-success-soft-foreground border border-success/25',
        warning: 'bg-warning-soft text-warning-soft-foreground border border-warning/25',
        info: 'bg-info-soft text-info-soft-foreground border border-info/25',
        outline: 'text-foreground border border-border bg-card',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.25 text-[11px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

export function Badge({
  className,
  variant,
  size,
  dot = false,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            'size-1.5 rounded-full shrink-0',
            dotColor ??
              (variant === 'success'
                ? 'bg-success'
                : variant === 'warning'
                  ? 'bg-warning'
                  : variant === 'danger' || variant === 'destructive'
                    ? 'bg-destructive'
                    : variant === 'info'
                      ? 'bg-info'
                      : 'bg-current'),
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
