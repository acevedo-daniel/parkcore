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
    <Link
      aria-label={`Open session for ${session.vehicle.plate}`}
      className="group grid gap-4 rounded-[1.35rem] border border-[#121417] bg-white p-5 text-[#121417] transition-colors hover:bg-[#ffcc00] sm:grid-cols-[minmax(9rem,1.1fr)_minmax(7rem,0.8fr)_minmax(8rem,1fr)_auto] sm:items-center"
      to={to}
    >
      <div className="flex items-center gap-3">
        <Plate plate={session.vehicle.plate} />
        <span className="text-xs font-semibold text-[#45423c]">
          {session.vehicle.type.replaceAll('_', ' ')}
        </span>
      </div>
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#6d695f]">
          Arrived
        </p>
        <div className="mt-1 text-sm font-semibold">
          <OperationalTimestamp value={session.startTime} />
        </div>
      </div>
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#6d695f]">
          Elapsed
        </p>
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
        <span className="rounded-full border border-[#121417] px-2.5 py-1 text-xs font-bold">
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
    <section
      aria-label="Checkout summary"
      className="rounded-[1.35rem] border border-[#121417] bg-[#f1eee7] p-5 text-[#121417]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[#121417]/20 pb-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#6d695f]">
          Started
        </span>
        <OperationalTimestamp value={session.startTime} />
      </div>
      {!session.endTime ? (
        <div className="flex items-center justify-between gap-4 border-b border-[#121417]/20 py-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#6d695f]">
            Current calculation
          </span>
          <time className="type-operational" dateTime={now.toISOString()}>
            {formatTimestamp(now.toISOString())}
          </time>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4 border-b border-[#121417]/20 py-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#6d695f]">
          Rate
        </span>
        <span className="type-operational">
          {formatMoney(session.hourlyRateCents, session.currency)} / H
        </span>
      </div>
      {chargedHours ? (
        <div className="flex items-center justify-between gap-4 border-b border-[#121417]/20 py-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#6d695f]">
            Charged
          </span>
          <span className="type-operational">
            {chargedHours} {chargedHours === 1 ? 'hour' : 'hours'}
          </span>
        </div>
      ) : null}
      <div className="flex items-end justify-between gap-4 pt-5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#6d695f]">
          Total
        </span>
        <strong className="font-display text-3xl font-bold leading-none tracking-[-0.055em] tabular-nums">
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
