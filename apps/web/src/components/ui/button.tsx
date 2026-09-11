import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn.js';

const buttonVariants = cva(
  'parkcore-pressable inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'parkcore-raised-action border border-primary bg-primary text-primary-foreground hover:bg-primary-hover hover:border-primary-hover active:bg-primary-active',
        primary:
          'parkcore-raised-action border border-primary bg-primary text-primary-foreground hover:bg-primary-hover hover:border-primary-hover active:bg-primary-active',
        secondary:
          'parkcore-raised-action border border-border bg-surface text-foreground hover:bg-surface-hover hover:border-border-strong',
        destructive:
          'parkcore-raised-action border border-danger bg-danger text-danger-on-solid hover:bg-danger/90',
        danger:
          'parkcore-raised-action border border-danger bg-danger text-danger-on-solid hover:bg-danger/90',
        outline:
          'parkcore-raised-action border border-border bg-surface text-foreground hover:bg-surface-hover',
        ghost: 'hover:bg-surface-subtle text-foreground',
        quiet: 'hover:bg-surface-subtle text-foreground',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[var(--control-height-md)] px-4 py-2 text-sm',
        md: 'h-[var(--control-height-md)] px-4 py-2 text-sm',
        sm: 'h-[var(--control-height-sm)] gap-1.5 px-3 text-xs',
        lg: 'h-[var(--control-height-lg)] px-6 text-base',
        icon: 'size-[var(--control-height-md)] p-0',
        'icon-sm': 'size-[var(--control-height-sm)] p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        data-slot="button"
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = 'icon', variant = 'secondary', ...props }, ref) => {
    return (
      <Button
        data-slot="icon-button"
        variant={variant}
        size={size}
        className={className}
        ref={ref}
        {...props}
      />
    );
  },
);
IconButton.displayName = 'IconButton';
