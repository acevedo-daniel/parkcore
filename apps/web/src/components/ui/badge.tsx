import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-border-strong bg-primary text-primary-foreground',
        secondary: 'border-border-strong bg-muted text-secondary-foreground',
        outline: 'border-border-strong bg-card text-foreground',
        destructive: 'border-destructive/35 bg-destructive text-destructive-foreground',
        danger: 'border-destructive/35 bg-destructive-soft text-destructive-soft-foreground',
        success: 'border-success/35 bg-success-soft text-success-soft-foreground',
        warning: 'border-warning/35 bg-warning-soft text-warning-soft-foreground',
        info: 'border-info/35 bg-info-soft text-info-soft-foreground',
        brand: 'border-brand-strong/50 bg-brand-soft text-foreground',
        plate:
          'type-code rounded-xs border-border-strong bg-popover px-2.5 py-1 text-sm font-bold text-foreground shadow-xs select-all',
      },
      size: {
        default: '',
        sm: 'px-2 py-0.5 text-2xs',
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
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
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
  const resolvedVariant = variant ?? 'default';
  const dotTone =
    resolvedVariant === 'success'
      ? 'bg-success'
      : resolvedVariant === 'warning'
        ? 'bg-warning'
        : resolvedVariant === 'danger' || resolvedVariant === 'destructive'
          ? 'bg-destructive'
          : resolvedVariant === 'info'
            ? 'bg-info'
            : resolvedVariant === 'brand'
              ? 'bg-brand'
              : 'bg-current';

  return (
    <span
      data-slot="badge"
      data-variant={resolvedVariant}
      className={cn(badgeVariants({ variant: resolvedVariant, size }), className)}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn('size-2 shrink-0 rounded-full', dotColor ?? dotTone)}
        />
      ) : null}
      {children}
    </span>
  );
}
