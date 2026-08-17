import type { components } from '@parkcore/api-client';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

import { formatDuration, formatMoney, formatTimestamp } from '../../lib/format.js';
import { Plate } from './plate.js';
import { SessionStatus } from './status.js';

type Session = components['schemas']['ParkingSessionResponse'];

export function OperationalTimestamp({ label, value }: { label?: string; value: string }) {
  return (
    <span className="operational-timestamp">
      {label ? <span className="type-label">{label}</span> : null}
      <time className="type-operational" dateTime={value}>
        {formatTimestamp(value)}
      </time>
    </span>
  );
}

export function SessionRow({ session, to }: { session: Session; to: string }) {
  const duration = formatDuration(session.startTime, session.endTime ?? undefined);
  return (
    <Link aria-label={`Open session for ${session.vehicle.plate}`} className="session-row" to={to}>
      <Plate plate={session.vehicle.plate} />
      <span className="type-small">{session.vehicle.type.replaceAll('_', ' ')}</span>
      <OperationalTimestamp value={session.startTime} />
      <span className="type-operational">{duration}</span>
      <SessionStatus status={session.status} />
      <ArrowUpRight aria-hidden="true" size={18} />
    </Link>
  );
}

export function CheckoutSummary({ session }: { session: Session }) {
  const preview = session.endTime ? undefined : calculatePreview(session);
  const total = session.totalAmountCents ?? preview?.totalAmountCents;
  const chargedHours = preview?.chargedHours;
  return (
    <section className="checkout-summary" aria-label="Checkout summary">
      <div className="summary-row">
        <span className="type-label">Started</span>
        <OperationalTimestamp value={session.startTime} />
      </div>
      <div className="summary-row">
        <span className="type-label">Rate</span>
        <span className="type-operational">
          {formatMoney(session.hourlyRateCents, session.currency)} / H
        </span>
      </div>
      {chargedHours ? (
        <div className="summary-row">
          <span className="type-label">Charged</span>
          <span className="type-operational">
            {chargedHours} {chargedHours === 1 ? 'hour' : 'hours'}
          </span>
        </div>
      ) : null}
      <div className="summary-total">
        <span className="type-label">Total</span>
        <strong className="type-metric">
          {total === undefined ? '—' : formatMoney(total, session.currency)}
        </strong>
      </div>
    </section>
  );
}

function calculatePreview(session: Session) {
  const elapsedHours = (Date.now() - new Date(session.startTime).getTime()) / 3_600_000;
  const chargedHours = Math.max(1, Math.ceil(elapsedHours));
  return { chargedHours, totalAmountCents: chargedHours * session.hourlyRateCents };
}
