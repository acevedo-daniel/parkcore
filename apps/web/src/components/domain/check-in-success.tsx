import type { components } from '@parkcore/api-client';
import { CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { formatTimestamp } from '../../lib/format.js';
import { Button } from '../ui/button.js';
import { Plate } from './plate.js';

type Session = components['schemas']['ParkingSessionResponse'];

interface CheckInSuccessProps {
  onCheckInAnother: () => void;
  parkingTitle: string;
  session: Session;
  timezone?: string;
  to: string;
}

export function CheckInSuccess({
  onCheckInAnother,
  parkingTitle,
  session,
  timezone,
  to,
}: CheckInSuccessProps) {
  const { locale, t } = useAppearance();
  return (
    <section
      aria-label={t('checkInSuccess.region')}
      className="rounded-[var(--radius-xl)] border border-success-foreground bg-success-surface p-5 text-foreground shadow-xs sm:p-6"
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-success-on-solid">
          <CheckCircle2 aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="type-label text-success-text">{t('checkInSuccess.eyebrow')}</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.04em]">
            {t('checkInSuccess.title')}
          </h2>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-success-foreground/30 pt-5">
        <Plate plate={session.vehicle.plate} />
        <p className="text-sm font-semibold text-foreground-secondary">
          {formatTimestamp(session.startTime, timezone, locale)} · {parkingTitle}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to={to}>
            <ExternalLink aria-hidden="true" className="size-3.5" />
            {t('checkInSuccess.viewSession')}
          </Link>
        </Button>
        <Button onClick={onCheckInAnother} size="sm" variant="secondary">
          <Plus aria-hidden="true" className="size-3.5" />
          {t('checkInSuccess.checkInAnother')}
        </Button>
      </div>
    </section>
  );
}
