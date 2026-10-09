import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        danger: 'border-transparent bg-destructive-soft text-destructive-soft-foreground',
        success: 'border-transparent bg-success-soft text-success-soft-foreground',
        warning: 'border-transparent bg-warning-soft text-warning-soft-foreground',
        info: 'border-transparent bg-info-soft text-info-soft-foreground',
        brand: 'border-transparent bg-brand-soft text-foreground',
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
          className={cn('size-1.5 shrink-0 rounded-full', dotColor ?? dotTone)}
        />
      ) : null}
      {children}
    </span>
  );
}
