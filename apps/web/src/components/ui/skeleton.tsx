import { cn } from '@/lib/cn';

function Skeleton({
  className,
  'aria-busy': ariaBusy = true,
  'aria-hidden': ariaHidden = true,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-busy={ariaBusy}
      aria-hidden={ariaHidden}
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
