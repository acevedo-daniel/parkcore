import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { getPublicParkings, type PublicParkingQuery } from '../../lib/api/public-api.js';
import { publicUrl, useDocumentMeta } from '../../lib/document-meta.js';
import { formatMoney } from '../../lib/format.js';

function rateToCents(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  const cents = Math.round(parsed * 100);
  return Number.isFinite(parsed) && cents > 0 ? cents : undefined;
}

function pageFromSearchParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getFormText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

export function ParkingCatalogRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  useDocumentMeta({
    description: es
      ? 'Explorá cocheras activas por zona y tarifa por hora.'
      : 'Browse active ParkCore parking facilities by address and hourly rate.',
    publicUrl: publicUrl('/parkings'),
    title: es ? 'Cocheras | ParkCore' : 'Parkings | ParkCore',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [filterError, setFilterError] = useState<string>();
  const page = pageFromSearchParams(searchParams);
  const query: PublicParkingQuery = {
    limit: 30,
    page,
    maxHourlyRateCents: rateToCents(searchParams.get('maxRate') ?? ''),
    minHourlyRateCents: rateToCents(searchParams.get('minRate') ?? ''),
    search: searchParams.get('search') ?? undefined,
  };
  const parkingQuery = useQuery({
    queryKey: ['public-parkings', query],
    queryFn: () => getPublicParkings(query),
    placeholderData: (previousData) => previousData,
  });
  const hasFilters = [...searchParams.keys()].some((key) => key !== 'page');

  const applyFilters = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = getFormText(formData, 'search').trim();
    const minRateText = getFormText(formData, 'minRate');
    const maxRateText = getFormText(formData, 'maxRate');
    const minRate = rateToCents(minRateText);
    const maxRate = rateToCents(maxRateText);
    if (
      (minRateText.trim() && minRate === undefined) ||
      (maxRateText.trim() && maxRate === undefined)
    ) {
      setFilterError(es ? 'Las tarifas deben ser mayores que 0.' : 'Rates must be greater than 0.');
      return;
    }
    if (minRate !== undefined && maxRate !== undefined && minRate > maxRate) {
      setFilterError(
        es
          ? 'La tarifa mínima no puede superar la máxima.'
          : 'Minimum rate cannot exceed maximum rate.',
      );
      return;
    }
    setFilterError(undefined);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (minRate !== undefined) params.set('minRate', minRateText);
    if (maxRate !== undefined) params.set('maxRate', maxRateText);
    setSearchParams(params);
  };

  const changePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));
    setSearchParams(params);
  };

  return (
    <section className="min-h-full bg-white pb-20 pt-10 sm:pb-28 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="grid gap-8 border-b border-[#1d241f]/10 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
              {es ? 'Encontrá dónde dejarlo' : 'Find where to leave it'}
            </p>
            <h1 className="mt-4 font-display text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#1d241f] sm:text-5xl lg:text-6xl">
              {es
                ? 'Cocheras que se entienden antes de llegar.'
                : 'Facilities you can understand before you arrive.'}
            </h1>
          </div>
          <p className="max-w-lg text-base leading-relaxed text-[#3f3f3f] lg:col-span-4 lg:col-start-9 sm:text-lg">
            {es
              ? 'Buscá por zona o compará tarifas. Los datos importantes aparecen primero, sin hacerte recorrer una ciudad de pantallas.'
              : 'Search by area or compare rates. The important details come first, without sending you through a city of screens.'}
          </p>
        </header>

        <form
          className="mt-8 grid gap-4 rounded-[2rem] border border-[#121417]/10 bg-white p-5 shadow-[0_8px_0_rgba(18,20,23,0.08)] lg:grid-cols-12 lg:items-end lg:p-6"
          key={searchParams.toString()}
          onSubmit={applyFilters}
        >
          <div className="lg:col-span-6">
            <label className="mb-2 block text-xs font-bold text-[#121417]" htmlFor="parking-search">
              {es ? '¿A dónde vas?' : 'Where are you going?'}
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-[#121417]/10 bg-[#f5f5f5] px-3 focus-within:border-[#121417]/30 focus-within:bg-white">
              <Search aria-hidden="true" className="size-4 shrink-0 text-[#121417]" />
              <input
                className="h-12 w-full bg-transparent text-sm font-medium text-[#1d241f] outline-none placeholder:text-[#748074]"
                defaultValue={searchParams.get('search') ?? ''}
                id="parking-search"
                name="search"
                placeholder={es ? 'Nombre, barrio o dirección' : 'Name, neighborhood, or address'}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-3">
            <label className="block text-xs font-bold text-[#121417]" htmlFor="min-rate">
              {es ? 'Mínimo por hora' : 'Min. rate (USD)'}
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-[#121417]/10 bg-[#f5f5f5] px-3 text-sm font-medium text-[#121417] outline-none placeholder:text-[#737373] focus:border-[#121417]/30 focus:bg-white"
                defaultValue={searchParams.get('minRate') ?? ''}
                id="min-rate"
                inputMode="decimal"
                min="0.01"
                name="minRate"
                placeholder="—"
                step="0.01"
                type="number"
              />
            </label>
            <label className="block text-xs font-bold text-[#121417]" htmlFor="max-rate">
              {es ? 'Máximo por hora' : 'Max. rate (USD)'}
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-[#121417]/10 bg-[#f5f5f5] px-3 text-sm font-medium text-[#121417] outline-none placeholder:text-[#737373] focus:border-[#121417]/30 focus:bg-white"
                defaultValue={searchParams.get('maxRate') ?? ''}
                id="max-rate"
                inputMode="decimal"
                min="0.01"
                name="maxRate"
                placeholder="—"
                step="0.01"
                type="number"
              />
            </label>
          </div>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#121417] px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-[#ffcc00] hover:text-[#121417] active:translate-y-0 lg:col-span-3"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            {es ? 'Aplicar filtros' : 'Apply filters'}
          </button>
          {filterError ? (
            <p className="lg:col-span-full text-sm font-medium text-[#b42318]" role="alert">
              {filterError}
            </p>
          ) : null}
        </form>

        {parkingQuery.isFetching && !parkingQuery.isLoading ? (
          <p className="mt-5 text-sm font-medium text-[#3f3f3f]" role="status">
            {es ? 'Actualizando cocheras…' : 'Refreshing parkings…'}
          </p>
        ) : null}
        {parkingQuery.isLoading ? <CatalogSkeleton /> : null}
        {parkingQuery.isError ? (
          <section
            className="mt-10 rounded-[2rem] border border-[#121417]/20 bg-[#f5f5f5] p-8"
            role="alert"
          >
            <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
              {es ? 'No pudimos cargar el directorio' : 'We could not load the directory'}
            </p>
            <p className="mt-3 text-base text-[#3f3f3f]">
              {es
                ? 'Probá actualizar las cocheras en unos instantes.'
                : 'We could not load active parkings. Try refreshing in a moment.'}
            </p>
            <button
              className="mt-5 rounded-full bg-[#121417] px-5 py-3 text-sm font-bold text-white hover:bg-[#ffcc00] hover:text-[#121417]"
              onClick={() => {
                void parkingQuery.refetch();
              }}
              type="button"
            >
              {es ? 'Reintentar' : 'Try again'}
            </button>
          </section>
        ) : null}
        {parkingQuery.data?.data.length === 0 ? (
          <section className="mt-10 rounded-[2rem] border border-dashed border-[#121417]/20 bg-white p-8 text-center">
            <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
              {es ? 'Sin coincidencias' : 'No matches yet'}
            </p>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-[#1d241f]">
              {es ? 'No encontramos cocheras con esos filtros.' : 'No active parkings'}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#526052]">
              {es
                ? 'Probá con otra zona o ampliá el rango de tarifas.'
                : 'Try a different address or rate range.'}
            </p>
            {hasFilters ? (
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#121417]/15 px-4 py-2.5 text-sm font-bold text-[#121417] hover:bg-[#ffcc00]"
                onClick={() => {
                  setSearchParams({});
                }}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
                {es ? 'Limpiar filtros' : 'Clear filters'}
              </button>
            ) : null}
          </section>
        ) : null}
        {parkingQuery.data?.data.length ? (
          <div
            aria-label={es ? 'Resultados de cocheras' : 'Parking results'}
            className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {parkingQuery.data.data.map((parking) => (
              <Link
                aria-label={`${es ? 'Abrir' : 'Open'} ${parking.title}`}
                className="group flex min-h-72 flex-col justify-between rounded-[2rem] border border-[#121417]/10 bg-white p-7 transition-transform hover:-translate-y-1 hover:shadow-[0_8px_0_rgba(18,20,23,0.08)]"
                key={parking.id}
                to={`/parkings/${parking.id}`}
              >
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f5] px-3 py-1.5 text-xs font-bold text-[#121417]">
                    <span className="size-1.5 rounded-full bg-[#121417]" />
                    {parking.isActive
                      ? es
                        ? 'Cochera activa'
                        : 'Facility active'
                      : es
                        ? 'Consultar'
                        : 'Check first'}
                  </span>
                  <h2 className="mt-12 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-[#1d241f]">
                    {parking.title}
                  </h2>
                  <p className="mt-3 max-w-64 text-sm leading-relaxed text-[#3f3f3f]">
                    {parking.address}
                  </p>
                </div>
                <div className="mt-8 flex items-end justify-between border-t border-[#121417]/10 pt-5">
                  <div>
                    <span className="block text-xs font-medium text-[#3f3f3f]">
                      {es ? 'Tarifa por hora' : 'Hourly rate'}
                    </span>
                    <span className="font-mono text-lg font-bold text-[#1d241f]">
                      {formatMoney(parking.hourlyRateCents, parking.currency)}
                      <span className="text-xs font-medium"> / h</span>
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1d241f]">
                    {es ? 'Ver detalles' : 'View details'}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
        {parkingQuery.data ? (
          <nav
            aria-label={es ? 'Paginación de cocheras' : 'Parking catalog pagination'}
            className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#1d241f]/10 pt-7"
          >
            <Button
              className="rounded-full border-[#121417]/15 bg-white text-[#121417] hover:bg-[#ffcc00]"
              disabled={!parkingQuery.data.meta.hasPreviousPage}
              onClick={() => {
                changePage(parkingQuery.data.meta.page - 1);
              }}
              type="button"
              variant="secondary"
            >
              {es ? 'Anterior' : 'Previous'}
            </Button>
            <span aria-live="polite" className="text-sm font-medium text-[#3f3f3f]">
              {es
                ? `Página ${String(parkingQuery.data.meta.page)} de ${String(parkingQuery.data.meta.totalPages)}`
                : `Page ${String(parkingQuery.data.meta.page)} of ${String(parkingQuery.data.meta.totalPages)}`}
            </span>
            <Button
              className="rounded-full border-[#121417]/15 bg-white text-[#121417] hover:bg-[#ffcc00]"
              disabled={!parkingQuery.data.meta.hasNextPage}
              onClick={() => {
                changePage(parkingQuery.data.meta.page + 1);
              }}
              type="button"
              variant="secondary"
            >
              {es ? 'Siguiente' : 'Next'}
            </Button>
          </nav>
        ) : null}
      </div>
    </section>
  );
}

function CatalogSkeleton() {
  return (
    <div aria-label="Loading parkings" className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="min-h-72 animate-pulse rounded-[2rem] border border-[#121417]/10 bg-white p-7"
          key={index}
        >
          <div className="h-7 w-28 rounded-full bg-[#ebe4d6]" />
          <div className="mt-14 h-7 w-3/4 rounded bg-[#ebe4d6]" />
          <div className="mt-3 h-4 w-1/2 rounded bg-[#ebe4d6]" />
          <div className="mt-20 h-px bg-[#ebe4d6]" />
        </div>
      ))}
    </div>
  );
}
