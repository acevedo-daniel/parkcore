import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex max-w-full cursor-pointer select-none items-center justify-center gap-2 break-words text-center text-sm font-semibold outline-none transition-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 active:scale-98 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border-2 border-border-strong bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        brand:
          'border-2 border-brand-strong bg-brand text-brand-foreground shadow-xs hover:bg-brand/90',
        secondary:
          'border-2 border-border-strong bg-card text-foreground shadow-xs hover:bg-accent',
        outline: 'border-2 border-border-strong bg-card text-foreground shadow-xs hover:bg-accent',
        ghost: 'text-foreground hover:bg-accent',
        destructive:
          'border-2 border-destructive-soft-foreground bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-11 rounded-lg px-4 py-2',
        sm: 'min-h-10 gap-1.5 rounded-lg px-3 py-2 text-xs',
        lg: 'min-h-12 rounded-lg px-6 py-2 text-base',
        icon: 'size-11 rounded-lg p-0',
        'icon-sm': 'size-10 rounded-lg p-0',
      },
      shape: {
        default: '',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  shape = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
