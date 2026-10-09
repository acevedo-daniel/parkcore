import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { Toggle as TogglePrimitive } from 'radix-ui';

const toggleVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-md text-sm font-semibold whitespace-nowrap outline-none transition-control hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        brand:
          'data-[state=on]:bg-brand data-[state=on]:text-brand-foreground hover:data-[state=on]:bg-brand',
        outline: 'border border-border bg-card shadow-xs hover:bg-accent',
      },
      size: {
        default: 'min-h-11 px-3',
        sm: 'min-h-10 px-2',
        lg: 'min-h-12 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
