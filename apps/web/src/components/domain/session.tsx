import type { components } from '@parkcore/api-client';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
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

export function ElapsedDuration({ startTime }: { startTime: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return <span className="type-operational">{formatDuration(startTime, now.toISOString())}</span>;
}

export function SessionRow({ session, to }: { session: Session; to: string }) {
  return (
    <Link aria-label={`Open session for ${session.vehicle.plate}`} className="session-row" to={to}>
      <Plate plate={session.vehicle.plate} />
      <span className="type-small">{session.vehicle.type.replaceAll('_', ' ')}</span>
      <OperationalTimestamp value={session.startTime} />
      {session.endTime ? (
        <span className="type-operational">
          {formatDuration(session.startTime, session.endTime)}
        </span>
      ) : (
        <ElapsedDuration startTime={session.startTime} />
      )}
      <SessionStatus status={session.status} />
      <ArrowUpRight aria-hidden="true" size={18} />
    </Link>
  );
}

export function SessionHistoryRow({ session, to }: { session: Session; to: string }) {
  const total =
    session.totalAmountCents === null
      ? '—'
      : formatMoney(session.totalAmountCents, session.currency);
  return (
    <Link
      aria-label={`Open session for ${session.vehicle.plate}`}
      className="session-history-row"
      to={to}
    >
      <OperationalTimestamp label="Date" value={session.startTime} />
      <Plate plate={session.vehicle.plate} />
      {session.endTime ? (
        <span className="session-history-duration type-operational">
          {formatDuration(session.startTime, session.endTime)}
        </span>
      ) : (
        <ElapsedDuration startTime={session.startTime} />
      )}
      <SessionStatus status={session.status} />
      <span className="type-operational">{total}</span>
      <ArrowUpRight aria-hidden="true" size={18} />
    </Link>
  );
}

export function CheckoutSummary({ session }: { session: Session }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (session.endTime) return;
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [session.endTime]);

  const preview = session.endTime ? undefined : calculatePreview(session, now);
  const total = session.totalAmountCents ?? preview?.totalAmountCents;
  const chargedHours = preview?.chargedHours;
  return (
    <section className="checkout-summary" aria-label="Checkout summary">
      <div className="summary-row">
        <span className="type-label">Started</span>
        <OperationalTimestamp value={session.startTime} />
      </div>
      {!session.endTime ? (
        <div className="summary-row">
          <span className="type-label">Current calculation</span>
          <time className="type-operational" dateTime={now.toISOString()}>
            {formatTimestamp(now.toISOString())}
          </time>
        </div>
      ) : null}
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

function calculatePreview(session: Session, now: Date) {
  const elapsedHours = (now.getTime() - new Date(session.startTime).getTime()) / 3_600_000;
  const chargedHours = Math.max(1, Math.ceil(elapsedHours));
  return { chargedHours, totalAmountCents: chargedHours * session.hourlyRateCents };
}
