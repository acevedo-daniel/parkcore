import { ArrowUpRight, CircleAlert } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { cn } from '../../lib/cn.js';
import type { MessageKey } from '../../lib/localization.js';

export type AttentionState = 'FULL' | 'LIMITED' | 'LONG_RUNNING' | 'PAUSED';

const stateLabelKey: Record<AttentionState, MessageKey> = {
  FULL: 'attention.full',
  LIMITED: 'attention.limited',
  LONG_RUNNING: 'attention.longRunning',
  PAUSED: 'attention.paused',
};

interface AttentionItemProps {
  className?: string;
  description: string;
  parkingTitle?: string;
  plate?: string;
  state: AttentionState;
  to: string;
}

export function AttentionItem({
  className,
  description,
  parkingTitle,
  plate,
  state,
  to,
}: AttentionItemProps) {
  const { t } = useAppearance();
  const stateLabel = t(stateLabelKey[state]);
  const subject = parkingTitle ?? plate ?? '';

  return (
    <li
      className={cn(
        'border-b border-border-subtle py-4 first:pt-0 last:border-b-0 last:pb-0',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-warning-surface text-warning-text">
          <CircleAlert aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="type-label text-warning-text">{stateLabel}</p>
            {subject ? <p className="text-sm font-bold text-foreground">{subject}</p> : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">{description}</p>
          <Link
            className="mt-3 inline-flex items-center gap-1 text-sm font-bold underline decoration-accent decoration-2 underline-offset-4"
            to={to}
          >
            {t('attention.open')}
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </div>
    </li>
  );
}
