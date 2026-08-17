import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/cn.js';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
  variant?: ButtonVariant;
}

export function Button({
  children,
  className,
  fullWidth,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn('button', `button-${variant}`, fullWidth && 'button-full', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn('icon-button', className)} {...props}>
      {children}
    </button>
  );
}
