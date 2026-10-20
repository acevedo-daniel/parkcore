import { cn } from '../../lib/cn.js';

interface BrandMarkProps {
  className?: string;
}

/** The parked-car tile shared with the favicon and app icons, drawn with theme tokens. */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('size-8 shrink-0', className)}
      data-slot="brand-mark"
      focusable="false"
      viewBox="0 0 64 64"
    >
      <path
        className="fill-brand"
        d="M14 0H50A14 14 0 0 1 64 14V40A24 24 0 0 1 40 64H14A14 14 0 0 1 0 50V14A14 14 0 0 1 14 0Z"
      />
      <g className="fill-brand-foreground">
        <rect height="38" rx="3" width="6" x="8" y="10" />
        <rect height="30" rx="3" width="6" x="50" y="10" />
        <rect height="42" rx="9" width="26" x="19" y="10" />
      </g>
      <g className="fill-brand">
        <rect height="8" rx="3" width="17" x="23.5" y="17" />
        <rect height="3.5" rx="1.75" width="14" x="25" y="42" />
      </g>
    </svg>
  );
}
