import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, MapPin, ReceiptText } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { getPublicParkings, type PublicParking } from '../../lib/api/public-api.js';
import { cn } from '../../lib/cn.js';
import { formatMoney } from '../../lib/format.js';

const FALLBACK_FACILITIES: PublicParking[] = [
  {
    address: 'Av. Corrientes 1050, San Nicolás',
    capacity: 120,
    createdAt: new Date().toISOString(),
    currency: 'USD',
    description: null,
    hourlyRateCents: 1500,
    id: 'mock-central',
    image: null,
    isActive: true,
    lat: -34.6037,
    lng: -58.3816,
    ownerId: 'owner-1',
    title: 'Central Obelisco',
    updatedAt: new Date().toISOString(),
  },
  {
    address: 'Av. Santa Fe 4150, Palermo',
    capacity: 85,
    createdAt: new Date().toISOString(),
    currency: 'USD',
    description: null,
    hourlyRateCents: 2000,
    id: 'mock-palermo',
    image: null,
    isActive: true,
    lat: -34.5816,
    lng: -58.4206,
    ownerId: 'owner-2',
    title: 'Palermo Plaza Italia',
    updatedAt: new Date().toISOString(),
  },
  {
    address: 'Juana Manso 850, Dique 3',
    capacity: 200,
    createdAt: new Date().toISOString(),
    currency: 'USD',
    description: null,
    hourlyRateCents: 2500,
    id: 'mock-madero',
    image: null,
    isActive: true,
    lat: -34.6087,
    lng: -58.3644,
    ownerId: 'owner-3',
    title: 'Puerto Madero Dique 3',
    updatedAt: new Date().toISOString(),
  },
];

const DURATION_OPTIONS = [
  { hours: 1, labelEs: '1 hora', labelEn: '1 hour' },
  { hours: 2, labelEs: '2 horas', labelEn: '2 hours' },
  { hours: 4, labelEs: '4 horas', labelEn: '4 hours' },
  { hours: 8, labelEs: '8 horas', labelEn: '8 hours' },
];

export function ParkingCalculatorWidget({ className }: { className?: string }) {
  const { language } = useAppearance();
  const es = language === 'es';
  const selectId = useId();

  const parkingsQuery = useQuery({
    queryKey: ['public-parkings-widget'],
    queryFn: () => getPublicParkings({ limit: 10 }),
    staleTime: 60_000,
  });

  const availableFacilities = useMemo(() => {
    const list = parkingsQuery.data ? parkingsQuery.data.data.filter((p) => p.isActive) : [];
    return list.length > 0 ? list : FALLBACK_FACILITIES;
  }, [parkingsQuery.data]);

  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedHours, setSelectedHours] = useState<number>(2);

  const selectedFacility: PublicParking = useMemo(() => {
    const found = availableFacilities.find((f) => f.id === selectedId);
    if (found) return found;
    return availableFacilities[0];
  }, [availableFacilities, selectedId]);

  const totalCents = selectedFacility.hourlyRateCents * selectedHours;
  const currency = selectedFacility.currency;

  const targetLink = selectedFacility.id.startsWith('mock-')
    ? '/parkings'
    : `/parkings/${selectedFacility.id}`;

  return (
    <div
      className={cn(
        'relative w-full max-w-[460px] rounded-[2rem_2rem_4.5rem_2rem] border border-[#1d241f]/10 bg-[#fffdf7] p-6 text-[#1d241f] shadow-[0_16px_0_rgba(29,36,31,0.13)] sm:p-8',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#1d241f]/10 pb-5">
        <div>
          <p className="text-xs font-bold tracking-[0.1em] text-[#b14d30] uppercase">
            {es ? 'Antes de salir' : 'Before you go'}
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold tracking-[-0.03em] text-[#1d241f]">
            {es ? 'Calculá una estadía' : 'Estimate a stay'}
          </h2>
        </div>
        <ReceiptText aria-hidden="true" className="mt-1 size-5 text-[#b14d30]" />
      </div>

      {/* Input 1: Facility selector */}
      <div className="rounded-2xl border border-[#1d241f]/10 bg-[#f3eddf] p-4 transition-colors focus-within:border-[#1d241f]/30 focus-within:bg-[#fffdf7]">
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-semibold text-[#465245]">
          {es ? '¿A qué cochera vas?' : 'Where are you parking?'}
        </label>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e7bf45] text-[#1d241f]">
              <MapPin aria-hidden="true" className="size-3.5" />
            </div>
            <select
              id={selectId}
              aria-label={es ? 'Elegir cochera' : 'Choose facility'}
              className="w-full cursor-pointer truncate bg-transparent font-display text-base font-bold text-[#1d241f] focus:outline-none"
              value={selectedFacility.id}
              onChange={(e) => {
                setSelectedId(e.target.value);
              }}
            >
              {availableFacilities.map((facility) => (
                <option key={facility.id} value={facility.id} className="text-[#1d241f]">
                  {facility.title}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right shrink-0">
            <span className="font-mono text-xs font-bold text-[#1d241f]">
              {formatMoney(selectedFacility.hourlyRateCents, currency)}
            </span>
            <span className="block text-[10px] text-[#526052]">/ h</span>
          </div>
        </div>
      </div>

      {/* Input 2: Duration selection */}
      <div className="mt-3 rounded-2xl border border-[#1d241f]/10 bg-[#f3eddf] p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#465245]">
            <Clock aria-hidden="true" className="size-3.5 text-[#b14d30]" />
            {es ? 'Estadía estimada' : 'Estimated stay'}
          </span>
          <span className="font-mono text-xs font-bold text-[#1d241f]">
            {selectedHours} {selectedHours === 1 ? (es ? 'hora' : 'hour') : es ? 'horas' : 'hours'}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.hours}
              type="button"
              onClick={() => {
                setSelectedHours(opt.hours);
              }}
              className={cn(
                'cursor-pointer rounded-xl px-1 py-2 text-center text-xs font-bold transition-all',
                selectedHours === opt.hours
                  ? 'bg-[#1d241f] text-[#fffdf7] shadow-xs'
                  : 'border border-[#1d241f]/5 bg-[#fffdf7] text-[#1d241f] hover:bg-white',
              )}
            >
              {es ? opt.labelEs : opt.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="my-5 px-1 text-xs">
        <div className="flex items-baseline justify-between border-t border-[#1d241f]/10 pt-4">
          <div>
            <span className="block text-xs font-semibold text-[#465245]">
              {es ? 'Presupuesto orientativo' : 'A simple estimate'}
            </span>
            <span className="text-[11px] text-[#526052]">
              {es ? 'Según tarifa publicada' : 'Based on the published rate'}
            </span>
          </div>
          <span className="tabular-nums font-display text-3xl font-extrabold tracking-tight text-[#1d241f]">
            {formatMoney(totalCents, currency)}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <Link
        to={targetLink}
        className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#1d241f] px-6 py-4 text-center font-display text-base font-bold text-[#fffdf7] shadow-[0_5px_0_#b14d30] transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        <span>{es ? 'Ver la cochera' : 'View this facility'}</span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform group-hover:translate-x-1"
        />
      </Link>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-[#526052]">
        {es
          ? 'Es una estimación: confirmá los detalles de la cochera antes de llegar.'
          : 'This is an estimate: confirm facility details before arriving.'}
      </p>
    </div>
  );
}
