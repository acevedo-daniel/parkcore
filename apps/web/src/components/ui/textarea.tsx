import * as React from 'react';
import { cn } from '@/lib/cn';
import { useFieldControlProps } from '@/components/ui/field';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  const fieldProps = useFieldControlProps(props);

  return (
    <textarea
      {...props}
      {...fieldProps}
      className={cn(
        'control min-h-28 w-full min-w-0 resize-y rounded-md border border-input bg-muted px-3.5 py-3 text-sm font-medium text-foreground shadow-xs outline-none transition-control placeholder:text-muted-foreground focus:border-primary focus:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100',
        className,
      )}
      data-slot="textarea"
    />
  );
}

export { Textarea };
