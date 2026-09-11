import type { components } from '@parkcore/api-client';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
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
  const { language } = useAppearance();
  const es = language === 'es';
  return (
    <Link
      aria-label={`Open session for ${session.vehicle.plate}`}
      className="group grid gap-4 border-b border-border-subtle bg-surface py-5 text-foreground transition-colors duration-200 hover:bg-surface-hover sm:grid-cols-[minmax(9rem,1.1fr)_minmax(7rem,0.8fr)_minmax(8rem,1fr)_auto] sm:items-center"
      to={to}
    >
      <div className="flex items-center gap-3">
        <Plate plate={session.vehicle.plate} />
        <span className="text-xs font-semibold text-foreground-secondary">
          {session.vehicle.type.replaceAll('_', ' ')}
        </span>
      </div>
      <div>
        <p className="type-label text-foreground-muted">{es ? 'Ingreso' : 'Arrived'}</p>
        <div className="mt-1 text-sm font-semibold">
          <OperationalTimestamp value={session.startTime} />
        </div>
      </div>
      <div>
        <p className="type-label text-foreground-muted">{es ? 'Transcurrido' : 'Elapsed'}</p>
        <div className="mt-1 text-sm font-semibold">
          {session.endTime ? (
            <span className="type-operational">
              {formatDuration(session.startTime, session.endTime)}
            </span>
          ) : (
            <ElapsedDuration startTime={session.startTime} />
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span className="rounded-full border border-border-strong px-2.5 py-1 text-xs font-bold">
          {session.status[0]}
          {session.status.slice(1).toLowerCase()}
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
    </Link>
  );
}

export function SessionHistoryRow({ session, to }: { session: Session; to: string }) {
  const total =
    session.totalAmountCents === null
      ? 'N/A'
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
  const { language } = useAppearance();
  const es = language === 'es';
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
    <section
      aria-label="Checkout summary"
      className="rounded-[var(--radius-lg)] border border-border bg-surface-emphasis p-5 text-foreground"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
        <span className="type-label text-foreground-muted">{es ? 'Ingreso' : 'Started'}</span>
        <OperationalTimestamp value={session.startTime} />
      </div>
      {!session.endTime ? (
        <div className="flex items-center justify-between gap-4 border-b border-border py-3">
          <span className="type-label text-foreground-muted">
            {es ? 'Cálculo actual' : 'Current calculation'}
          </span>
          <time className="type-operational" dateTime={now.toISOString()}>
            {formatTimestamp(now.toISOString())}
          </time>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4 border-b border-border py-3">
        <span className="type-label text-foreground-muted">{es ? 'Tarifa' : 'Rate'}</span>
        <span className="type-operational">
          {formatMoney(session.hourlyRateCents, session.currency)} / H
        </span>
      </div>
      {chargedHours ? (
        <div className="flex items-center justify-between gap-4 border-b border-border py-3">
          <span className="type-label text-foreground-muted">{es ? 'Cobrado' : 'Charged'}</span>
          <span className="type-operational">
            {chargedHours} {chargedHours === 1 ? (es ? 'hora' : 'hour') : es ? 'horas' : 'hours'}
          </span>
        </div>
      ) : null}
      <div className="flex items-end justify-between gap-4 pt-5">
        <span className="type-label text-foreground-muted">Total</span>
        <strong className="font-display text-3xl font-bold leading-none tracking-[-0.055em] tabular-nums">
          {total === undefined ? 'N/A' : formatMoney(total, session.currency)}
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
