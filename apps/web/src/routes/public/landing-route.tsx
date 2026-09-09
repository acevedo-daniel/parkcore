import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock3, Database, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import { CapacityGauge } from '../../components/ui/capacity-gauge.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js';
import { LicensePlateBadge } from '../../components/ui/license-plate-badge.js';
import { Skeleton } from '../../components/ui/feedback.js';
import { DemoLoginButton } from '../../features/auth/demo-login-button.js';
import { getPublicParkings } from '../../lib/api/public-api.js';
import { PARKCORE_PUBLIC_URL, useDocumentMeta } from '../../lib/document-meta.js';
import { formatMoney } from '../../lib/format.js';

export function LandingRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const navigate = useNavigate();

  useDocumentMeta({
    description:
      'Comando operativo y directorio público para cocheras independientes: capacidad en tiempo real, ingreso de patentes y cobro por snapshot.',
    publicUrl: PARKCORE_PUBLIC_URL,
    title: 'ParkCore | Operaciones de Cocheras',
  });

  const featuredQuery = useQuery({
    queryKey: ['public-featured-parkings'],
    queryFn: () => getPublicParkings({ page: 1, limit: 3 }),
  });

  const pillars = [
    {
      icon: ShieldCheck,
      badge: es ? 'Capacidad Estricta' : 'Strict Capacity',
      title: es ? 'Fidelidad de Estado Absoluta' : 'Absolute State Fidelity',
      description: es
        ? 'Validación serializable en base de datos. Ningún vehículo entra si la cochera está llena ni puede registrarse dos veces.'
        : 'Serializable database validations. Zero double check-ins and zero intake when maximum capacity is reached.',
    },
    {
      icon: Clock3,
      badge: es ? 'Snapshot Inmutable' : 'Immutable Snapshot',
      title: es ? 'Tarifas Congeladas al Ingreso' : 'Rates Frozen at Check-in',
      description: es
        ? 'El arancel por hora se captura al segundo de entrada. Los cambios tarifarios posteriores no alteran la estadía en curso.'
        : 'The hourly rate is captured the exact second of entry. Subsequent price changes never alter an ongoing stay.',
    },
    {
      icon: Database,
      badge: es ? 'Auditoría & Cobro' : 'Audit & Billing',
      title: es ? 'Liquidación y Recaudación Clara' : 'Transparent Checkout Billing',
      description: es
        ? 'Cálculo al alza con mínimo de 1 hora. Historial inmutable con comprobante detallado y métricas de ingresos.'
        : 'Ceiling-hour rounding with 1-hour minimum. Immutable ledger with receipt breakdown and revenue analytics.',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-foreground pb-20">
      {/* Hero Section */}
      <section
        aria-labelledby="landing-title"
        className="relative mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8"
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden"
        >
          <div className="h-[28rem] w-[50rem] rounded-full bg-gradient-to-b from-primary/[0.08] via-primary/[0.02] to-transparent blur-3xl" />
        </div>

        {/* Hero Header Area: Centered, Prestigious, Airy */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 shadow-xs backdrop-blur-xs">
            <span className="size-2 rounded-full bg-primary ring-2 ring-primary/25" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              ParkCore
            </span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <span className="text-xs font-medium text-foreground-secondary">
              {es ? 'Operaciones de Cocheras' : 'Parking Operations System'}
            </span>
          </div>

          <h1
            className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance"
            id="landing-title"
          >
            {es ? (
              <>
                Cocheras bajo control{' '}
                <span className="text-primary underline decoration-primary/30 underline-offset-8">
                  operativo
                </span>
                .
              </>
            ) : (
              <>
                Parking facilities under{' '}
                <span className="text-primary underline decoration-primary/30 underline-offset-8">
                  operational
                </span>{' '}
                control.
              </>
            )}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-foreground-secondary text-balance">
            {es
              ? 'Plataforma de comando en tiempo real para cocheras independientes. Ocupación en vivo, ingreso ágil de patentes, tarifas congeladas por snapshot y liquidación instantánea.'
              : 'Real-time command platform for independent parking operators. Live capacity gauge, rapid plate check-in, snapshot tariff billing, and instant stay checkout.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <DemoLoginButton
              className="h-11 px-6 text-sm font-bold"
              onSuccess={() => void navigate('/app', { replace: true })}
              variant="primary"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {es ? 'Probar demo en vivo (1-Click)' : 'Try live demo (1-Click)'}
            </DemoLoginButton>

            <Button asChild className="h-11 px-5" variant="secondary">
              <Link to="/parkings">
                {es ? 'Explorar cocheras' : 'Explore facilities'}
                <ArrowRight className="size-4 ml-1" aria-hidden="true" />
              </Link>
            </Button>

            <Button asChild className="h-11 px-4" variant="ghost">
              <Link to="/login">{es ? 'Acceso operador' : 'Operator login'}</Link>
            </Button>
          </div>
        </div>

        {/* Live Facility Telemetry Instrument Preview Card */}
        <div className="mt-14 mx-auto max-w-4xl">
          <div className="relative rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-7 shadow-raised overflow-hidden">
            {/* Ambient instrument highlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-primary/[0.06] blur-2xl"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary tracking-wider">
                    P / 01
                  </span>
                  <Badge variant="success" dot size="sm">
                    {es ? 'Operación Activa' : 'Live Operation'}
                  </Badge>
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                  Downtown Hub Garage
                </h2>
                <p className="flex items-center gap-1.5 text-xs text-foreground-secondary mt-0.5 font-mono">
                  <MapPin className="size-3.5 text-foreground-muted" /> Av. Corrientes 1240, CABA
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-[var(--radius-sm)] border border-border-strong bg-surface-subtle px-3.5 py-1.5 text-right">
                  <span className="block text-[10px] font-mono uppercase font-bold text-foreground-muted">
                    {es ? 'Tarifa snapshot' : 'Snapshot rate'}
                  </span>
                  <span className="font-mono text-base font-bold text-foreground tabular-nums">
                    USD 6.00 / hr
                  </span>
                </div>
              </div>
            </div>

            {/* Capacity gauge widget */}
            <div className="mt-6">
              <CapacityGauge
                active={18}
                capacity={24}
                label={es ? 'Ocupación en tiempo real' : 'Real-time occupancy'}
              />
            </div>

            {/* Simulated Active Sessions Mini-Ledger */}
            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary font-mono">
                  {es ? 'Últimos vehículos ingresados' : 'Recent active check-ins'}
                </span>
                <span className="text-xs font-mono text-primary font-semibold">
                  {es ? '3 de 18 adentro' : '3 of 18 inside'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-subtle/70">
                  <LicensePlateBadge plate="AB 123 CD" size="sm" vehicleType="CAR" />
                  <div className="text-right">
                    <span className="block font-mono text-xs font-semibold tabular-nums text-foreground">
                      01:42:15
                    </span>
                    <span className="block text-[10px] text-foreground-muted font-mono">
                      $12.00 due
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-subtle/70">
                  <LicensePlateBadge plate="AE 532 LO" size="sm" vehicleType="CAR" />
                  <div className="text-right">
                    <span className="block font-mono text-xs font-semibold tabular-nums text-foreground">
                      00:48:30
                    </span>
                    <span className="block text-[10px] text-foreground-muted font-mono">
                      $6.00 due
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-subtle/70">
                  <LicensePlateBadge plate="AF 910 PK" size="sm" vehicleType="MOTORCYCLE" />
                  <div className="text-right">
                    <span className="block font-mono text-xs font-semibold tabular-nums text-foreground">
                      02:15:00
                    </span>
                    <span className="block text-[10px] text-foreground-muted font-mono">
                      $18.00 due
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Truth Pillars */}
      <section
        aria-labelledby="pillars-title"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-border"
      >
        <div className="mx-auto max-w-2xl text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
            {es ? 'Ingeniería de Operaciones' : 'Operations Engineering'}
          </p>
          <h2
            className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
            id="pillars-title"
          >
            {es
              ? 'Diseñado para cocheras reales, no para reservas ficticias.'
              : 'Built for real operations, not consumer marketplaces.'}
          </h2>
          <p className="mt-3 text-sm text-foreground-secondary">
            {es
              ? 'Eliminamos la fricción de apps de consumidor. Priorizamos velocidad de admisión, integridad transaccional y cobro exacto.'
              : 'Zero consumer booking fluff. We focus purely on gatehouse intake velocity, transactional integrity, and accurate billing.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card
                key={pillar.title}
                className="flex flex-col justify-between hover:border-border-strong transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="size-10 rounded-[var(--radius-sm)] border border-primary/20 bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="size-5" />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
                      {pillar.badge}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed">
                    {pillar.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Featured Public Facilities Section */}
      <section
        aria-labelledby="featured-parkings-title"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-border"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
              {es ? 'Directorio Público' : 'Public Directory'}
            </p>
            <h2
              className="mt-1 text-2xl font-bold tracking-tight text-foreground"
              id="featured-parkings-title"
            >
              {es ? 'Cocheras activas en la red' : 'Active facilities in the network'}
            </h2>
            <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
              {es
                ? 'Información verificada de ubicación, capacidad y arancel por hora.'
                : 'Verified location, capacity, and hourly tariff information.'}
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/parkings">
              {es ? 'Ver todas las cocheras' : 'View all facilities'}
              <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        {featuredQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Loading facilities">
            <Skeleton className="h-44 rounded-[var(--radius-md)]" />
            <Skeleton className="h-44 rounded-[var(--radius-md)]" />
            <Skeleton className="h-44 rounded-[var(--radius-md)]" />
          </div>
        ) : featuredQuery.isError ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-sm text-foreground-secondary">
              {es
                ? 'No pudimos cargar las cocheras en este momento.'
                : 'Unable to load parking directory right now.'}
            </p>
            <Button
              className="mt-3"
              onClick={() => void featuredQuery.refetch()}
              size="sm"
              variant="secondary"
            >
              {es ? 'Reintentar' : 'Retry'}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredQuery.data?.data.map((parking) => (
              <Card
                key={parking.id}
                className="flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={parking.isActive ? 'success' : 'secondary'} dot size="sm">
                      {parking.isActive ? (es ? 'Activa' : 'Active') : es ? 'Inactiva' : 'Inactive'}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-foreground tabular-nums">
                      {formatMoney(parking.hourlyRateCents, parking.currency)} / hr
                    </span>
                  </div>
                  <CardTitle className="text-base sm:text-lg">
                    <Link
                      className="hover:text-primary transition-colors"
                      to={`/parkings/${parking.id}`}
                    >
                      {parking.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1.5 mt-1 font-mono">
                    <MapPin className="size-3.5 shrink-0 text-foreground-muted" />
                    <span className="truncate">{parking.address}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-foreground-secondary border-t border-border-subtle pt-3 mt-1 font-mono">
                    <span>{es ? 'Capacidad total' : 'Total capacity'}</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {parking.capacity} {es ? 'lugares' : 'spots'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
