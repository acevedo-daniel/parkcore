import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/cn';

const cardVariants = cva('min-w-0 rounded-lg border text-card-foreground', {
  variants: {
    tone: {
      default: 'border-border bg-card',
      success: 'border-success-soft-foreground bg-success-soft',
      warning: 'border-warning-soft-foreground bg-warning-soft',
    },
  },
  defaultVariants: {
    tone: 'default',
  },
});

function Card({
  asChild = false,
  className,
  tone = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof cardVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="card"
      data-tone={tone}
      className={cn(cardVariants({ tone }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex items-start gap-2 px-6', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('font-semibold leading-tight', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm text-foreground-secondary', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-action" className={cn('ml-auto shrink-0', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-footer" className={cn('flex items-center px-6', className)} {...props} />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
