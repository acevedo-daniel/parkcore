import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Clock, MapPin, ShieldCheck, Sparkles, Zap } from 'lucide-react';
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

  // Realistic mock of free spaces based on capacity
  const simulatedFreeSpots = useMemo(() => {
    const cap = selectedFacility.capacity;
    return Math.max(6, Math.round(cap * 0.18));
  }, [selectedFacility.capacity]);

  const targetLink = selectedFacility.id.startsWith('mock-')
    ? '/parkings'
    : `/parkings/${selectedFacility.id}`;

  return (
    <div
      className={cn(
        'relative w-full max-w-[480px] rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_24px_54px_-12px_rgba(0,0,0,0.18)] border border-black/5 text-[#121417]',
        className,
      )}
    >
      {/* Top pill badge */}
      <div className="flex items-center justify-between gap-2 pb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f1] px-3 py-1 text-xs font-semibold text-[#121417]">
          <ShieldCheck aria-hidden="true" className="size-3.5 text-[#10b981]" />
          {es ? 'Tarifa garantizada sin sorpresas' : 'Guaranteed transparent fee'}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-[#10b981]">
          <span className="size-2 rounded-full bg-[#10b981] animate-pulse" />
          {es ? 'En vivo' : 'Live'}
        </span>
      </div>

      {/* Input 1: Facility selector */}
      <div className="rounded-2xl bg-[#f7f8f5] p-4 transition-colors hover:bg-[#f1f3ee] border border-transparent focus-within:border-black/20">
        <label htmlFor={selectId} className="block text-xs font-medium text-[#404550] mb-1.5">
          {es ? '¿Dónde vas a estacionar?' : 'Where are you parking?'}
        </label>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="size-8 rounded-full bg-[#ffcc00] flex items-center justify-center shrink-0 text-[#121417] shadow-xs">
              <MapPin aria-hidden="true" className="size-4" />
            </div>
            <select
              id={selectId}
              aria-label={es ? 'Elegir cochera' : 'Choose facility'}
              className="w-full bg-transparent font-display text-base sm:text-lg font-bold text-[#121417] focus:outline-none cursor-pointer truncate"
              value={selectedFacility.id}
              onChange={(e) => {
                setSelectedId(e.target.value);
              }}
            >
              {availableFacilities.map((facility) => (
                <option key={facility.id} value={facility.id} className="text-[#121417]">
                  {facility.title}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right shrink-0">
            <span className="font-mono text-xs sm:text-sm font-bold text-[#121417]">
              {formatMoney(selectedFacility.hourlyRateCents, currency)}
            </span>
            <span className="block text-[11px] text-[#404550]">/ h</span>
          </div>
        </div>
      </div>

      {/* Input 2: Duration selection */}
      <div className="mt-3 rounded-2xl bg-[#f7f8f5] p-4 border border-transparent focus-within:border-black/20">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-medium text-[#404550] flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-3.5" />
            {es ? 'Tiempo estimado de estadía' : 'Estimated stay duration'}
          </span>
          <span className="font-mono text-xs font-bold text-[#121417]">
            {selectedHours} {selectedHours === 1 ? (es ? 'hora' : 'hour') : es ? 'horas' : 'hours'}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.hours}
              type="button"
              onClick={() => {
                setSelectedHours(opt.hours);
              }}
              className={cn(
                'rounded-xl py-2 px-1 text-center text-xs font-bold transition-all',
                selectedHours === opt.hours
                  ? 'bg-[#121417] text-white shadow-sm scale-[1.02]'
                  : 'bg-white text-[#121417] hover:bg-white/80 border border-black/5',
              )}
            >
              {es ? opt.labelEs : opt.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Breakdown Items (Wise style) */}
      <div className="my-5 space-y-3 px-1 text-xs">
        <div className="flex items-center justify-between text-[#404550]">
          <span className="flex items-center gap-2">
            <Zap aria-hidden="true" className="size-4 text-[#ffcc00] shrink-0 fill-[#ffcc00]" />
            {es ? 'Ingreso ágil' : 'Seamless entry'}
          </span>
          <span className="font-medium text-[#121417]">
            {es ? 'Con patente o código QR' : 'Via plate scan or QR'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#404550]">
          <span className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-4 text-[#10b981] shrink-0" />
            {es ? 'Lugares disponibles hoy' : 'Live spots available'}
          </span>
          <span className="font-mono font-bold text-[#10b981] flex items-center gap-1">
            <Check aria-hidden="true" className="size-3" />
            {simulatedFreeSpots} {es ? 'libres en este momento' : 'free right now'}
          </span>
        </div>

        <div className="pt-2 border-t border-black/8 flex items-baseline justify-between">
          <div>
            <span className="block text-xs font-medium text-[#404550]">
              {es ? 'Total estimado a pagar' : 'Estimated total cost'}
            </span>
            <span className="text-[11px] text-[#717684]">
              {es ? 'Fraccionamiento justo por minuto' : 'Fair per-minute billing'}
            </span>
          </div>
          <span className="font-display text-3xl font-extrabold tracking-tight text-[#121417] tabular-nums">
            {formatMoney(totalCents, currency)}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <Link
        to={targetLink}
        className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#ffcc00] py-4 px-6 text-center font-display text-base font-bold text-[#121417] transition-all hover:bg-[#e6b800] hover:shadow-md active:scale-[0.99]"
      >
        <span>{es ? 'Ver cochera e ingresar' : 'View parking & enter'}</span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform group-hover:translate-x-1"
        />
      </Link>

      <p className="mt-3 text-center text-[11px] text-[#717684]">
        {es
          ? 'No necesitás descargar ninguna app · Pagás al salir'
          : 'No app download required · Pay when leaving'}
      </p>
    </div>
  );
}
