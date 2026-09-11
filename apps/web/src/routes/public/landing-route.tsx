import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, ChevronDown, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { ParkingDiscoveryCard } from '../../components/domain/parking-discovery-card.js';
import { ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { DemoLoginButton } from '../../features/auth/demo-login-button.js';
import { ParkingCalculatorWidget } from '../../features/parking/parking-calculator-widget.js';
import { getPublicParkings } from '../../lib/api/public-api.js';
import { cn } from '../../lib/cn.js';
import { useDocumentMeta } from '../../lib/document-meta.js';

interface FaqItem {
  answerEn: string;
  answerEs: string;
  questionEn: string;
  questionEs: string;
}

const FAQS: FaqItem[] = [
  {
    questionEs: '¿Necesito descargar una aplicación para estacionar?',
    questionEn: 'Do I need to download an app to park?',
    answerEs:
      'No. ParkCore funciona desde la web y desde los accesos de las cocheras. Podés identificar tu estadía con la patente o un código QR.',
    answerEn:
      'No. ParkCore works on the web and at facility entrances. You can identify your stay with your plate or a QR code.',
  },
  {
    questionEs: '¿Cómo sé cuánto voy a pagar?',
    questionEn: 'How do I know how much I will pay?',
    answerEs:
      'Cada cochera publica su tarifa. Antes de ir podés estimar la estadía y, al salir, el comprobante deja claro qué se cobró.',
    answerEn:
      'Each facility publishes its rate. You can estimate your stay before arriving and the receipt makes the final charge clear when you leave.',
  },
  {
    questionEs: '¿Qué pasa si no tengo ticket?',
    questionEn: 'What if I do not have a ticket?',
    answerEs:
      'La estadía queda asociada a la patente o al acceso que elegiste. No dependés de un papel para resolver tu salida.',
    answerEn:
      'Your stay is associated with your plate or chosen access method. You do not depend on a piece of paper to leave.',
  },
  {
    questionEs: 'Tengo una cochera, ¿cómo la pruebo?',
    questionEn: 'I run a facility. How can I try it?',
    answerEs:
      'Podés entrar a la demo de operador con un clic y recorrer una operación completa con datos de ejemplo, sin configurar nada.',
    answerEn:
      'You can enter the operator demo in one click and walk through a complete operation with example data, with no setup required.',
  },
];

export function LandingRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useDocumentMeta({
    description: es
      ? 'Una manera más clara de encontrar, usar y operar una cochera.'
      : 'A clearer way to find, use, and run a parking facility.',
    title: es ? 'ParkCore | Una cochera clara' : 'ParkCore | Parking, made clear',
  });

  const parkingsQuery = useQuery({
    queryKey: ['public-parkings-landing'],
    queryFn: () => getPublicParkings({ limit: 6 }),
    staleTime: 60_000,
  });

  return (
    <div className="landing-page overflow-hidden bg-canvas text-foreground">
      <section className="bg-accent text-accent-foreground">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div className="lg:col-span-7">
            <p className="type-label inline-flex items-center gap-2 rounded-full border border-accent-strong bg-accent/70 px-3 py-1.5 text-accent-foreground">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent-foreground" />
              {es ? 'Para quienes se mueven todos los días' : 'For everyday movement'}
            </p>
            <h1 className="mt-7 max-w-3xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[5.1rem]">
              {es ? 'Parking, bajo control.' : 'Parking, under control.'}
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-accent-foreground/85 sm:text-xl">
              {es
                ? 'ParkCore ordena la entrada, el cobro y el historial de una cochera. Para que llegar, estacionar y salir vuelva a ser algo simple.'
                : 'ParkCore brings order to a facility’s entry, payment, and history, so arriving, parking, and leaving can feel simple again.'}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 hover:bg-primary-hover active:translate-y-0"
                to="/parkings"
              >
                {es ? 'Ver cocheras' : 'Browse facilities'}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
              <DemoLoginButton
                className="min-h-12 rounded-full border border-accent-strong bg-surface px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-surface-hover"
                onSuccess={() => {
                  void navigate('/app', { replace: true });
                }}
              >
                {es ? 'Recorrer la demo' : 'Explore the demo'}
              </DemoLoginButton>
            </div>
            <p className="mt-8 text-sm leading-relaxed text-accent-foreground/75">
              {es
                ? 'Sin depender de tickets de papel. Sin hacer más difícil una tarea cotidiana.'
                : 'No dependence on paper tickets. No need to make an everyday task harder.'}
            </p>
          </div>

          <div className="lg:col-span-5">
            <ParkingCalculatorWidget />
          </div>
        </div>
      </section>

      <section className="bg-surface py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="type-label text-foreground-muted">
                {es ? 'Una experiencia cotidiana' : 'An everyday experience'}
              </p>
              <h2 className="mt-4 font-display text-4xl font-bold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
                {es
                  ? 'No hace falta reinventar la cochera. Hace falta volverla clara.'
                  : 'Parking does not need reinventing. It needs to be clear.'}
              </h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-foreground-secondary lg:col-span-5 lg:col-start-8 sm:text-lg">
              {es
                ? 'La tecnología está para sacar ruido del camino: que la tarifa se entienda, que la entrada quede registrada y que nadie tenga que buscar un papel al salir.'
                : 'Technology should remove noise: make rates understandable, record each arrival, and keep nobody looking for a scrap of paper at the exit.'}
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-[var(--radius-xl)] border border-border bg-border md:grid-cols-3">
            {[
              {
                number: '01',
                titleEs: 'Llegar con contexto',
                titleEn: 'Arrive with context',
                bodyEs: 'Ubicación, tarifa y una estimación de estadía antes de salir.',
                bodyEn: 'Location, rate, and a stay estimate before you head out.',
              },
              {
                number: '02',
                titleEs: 'Entrar sin papel',
                titleEn: 'Enter without paper',
                bodyEs: 'La patente o el QR conectan la llegada con la operación.',
                bodyEn: 'Your plate or QR connects the arrival to the operation.',
              },
              {
                number: '03',
                titleEs: 'Salir con un comprobante',
                titleEn: 'Leave with a receipt',
                bodyEs: 'Un cierre claro, sin rituales ni información escondida.',
                bodyEn: 'A clear close, with no rituals or hidden information.',
              },
            ].map((item) => (
              <article className="min-h-64 bg-surface p-7 sm:p-8" key={item.number}>
                <span className="font-mono text-xs font-bold text-foreground-muted">
                  {item.number}
                </span>
                <h3 className="mt-12 max-w-48 font-display text-2xl font-bold leading-tight tracking-[-0.03em]">
                  {es ? item.titleEs : item.titleEn}
                </h3>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground-secondary">
                  {es ? item.bodyEs : item.bodyEn}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface-subtle py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <article className="rounded-[var(--radius-xl)] bg-surface p-8 shadow-hover sm:p-10">
            <span className="inline-flex rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
              {es ? 'Para quien maneja' : 'For drivers'}
            </span>
            <h2 className="mt-7 max-w-md font-display text-3xl font-bold leading-[1.04] tracking-[-0.04em] sm:text-4xl">
              {es
                ? 'Dejá de adivinar cómo va a ser estacionar.'
                : 'Stop guessing what parking will be like.'}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-foreground-secondary">
              {es
                ? 'Consultá las cocheras, entendé la tarifa y guardá el comprobante de una estadía en el mismo lugar.'
                : 'Browse facilities, understand the rate, and keep a stay receipt in one place.'}
            </p>
            <Link
              className="mt-9 inline-flex items-center gap-2 text-sm font-bold underline decoration-accent decoration-2 underline-offset-4"
              to="/parkings"
            >
              {es ? 'Buscar una cochera' : 'Find a facility'}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </article>

          <article className="rounded-[var(--radius-xl)] bg-surface-inverse p-8 text-foreground-on-inverse shadow-hover sm:p-10">
            <span className="inline-flex rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
              {es ? 'Para quien abre la persiana' : 'For facility operators'}
            </span>
            <h2 className="mt-7 max-w-md font-display text-3xl font-bold leading-[1.04] tracking-[-0.04em] sm:text-4xl">
              {es
                ? 'Que el trabajo de todos los días deje de depender de la memoria.'
                : 'Let everyday work stop depending on memory.'}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-foreground-on-inverse/75">
              {es
                ? 'Cada ingreso, cobro y salida queda a la vista. La operación conserva el ritmo de la cochera, no el de una planilla.'
                : 'Every entry, payment, and exit stays visible. The operation keeps the rhythm of the facility, not a spreadsheet.'}
            </p>
            <DemoLoginButton
              className="mt-9 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
              onSuccess={() => {
                void navigate('/app', { replace: true });
              }}
            >
              {es ? 'Ver una jornada de ejemplo' : 'See an example day'}
            </DemoLoginButton>
          </article>
        </div>
      </section>

      <section className="bg-surface py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="type-label text-foreground-muted">
                {es ? 'Cerca de donde vas' : 'Near where you are going'}
              </p>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
                {es ? 'Elegí el lugar, no el misterio.' : 'Choose the place, not the mystery.'}
              </h2>
            </div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold underline decoration-accent decoration-2 underline-offset-4"
              to="/parkings"
            >
              {es ? 'Ver todas las cocheras' : 'See all facilities'}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <FeaturedFacilities es={es} query={parkingsQuery} />
        </div>
      </section>

      <section className="bg-accent py-20 text-accent-foreground sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8">
          <div className="lg:col-span-5">
            <p className="type-label text-accent-foreground/75">
              {es ? 'La operación, sin teatro' : 'Operations, without theatre'}
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
              {es
                ? 'Tres momentos. Una historia que se puede seguir.'
                : 'Three moments. One story you can follow.'}
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed sm:text-lg">
              {es
                ? 'La herramienta acompaña lo que ya sucede en una cochera: recibir un auto, registrar una estadía y cerrar el día con tranquilidad.'
                : 'The tool supports what already happens at a facility: receive a car, record a stay, and close the day with confidence.'}
            </p>
          </div>
          <ol className="grid gap-4 lg:col-span-6 lg:col-start-7">
            {[
              {
                labelEs: 'Entrada',
                labelEn: 'Arrival',
                textEs: 'La patente o el QR abren una estadía que se puede ubicar después.',
                textEn: 'A plate or QR starts a stay you can find again later.',
              },
              {
                labelEs: 'Durante la estadía',
                labelEn: 'During the stay',
                textEs: 'La tarifa y el tiempo quedan vinculados, sin anotar de más.',
                textEn: 'Rate and time stay connected, without extra notes to chase.',
              },
              {
                labelEs: 'Salida',
                labelEn: 'Departure',
                textEs: 'El cierre deja un comprobante y un registro para quien lo necesite.',
                textEn: 'Closeout leaves a receipt and a record for whoever needs it.',
              },
            ].map((item, index) => (
              <li
                className="flex gap-5 rounded-[var(--radius-lg)] bg-surface p-5 text-foreground sm:p-6"
                key={item.labelEs}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">
                    {es ? item.labelEs : item.labelEn}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">
                    {es ? item.textEs : item.textEn}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-surface py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="type-label text-foreground-muted">
              {es ? 'Preguntas que aparecen en la puerta' : 'Questions that come up at the door'}
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
              {es
                ? 'Mejor dejarlo claro desde el principio.'
                : 'Better to make it clear from the start.'}
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface"
                  key={faq.questionEs}
                >
                  <button
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-5 p-5 text-left font-display text-base font-bold transition-colors hover:bg-surface-hover sm:p-6"
                    onClick={() => {
                      setOpenFaqIndex(isOpen ? null : index);
                    }}
                    type="button"
                  >
                    <span>{es ? faq.questionEs : faq.questionEn}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn('size-5 shrink-0 transition-transform', isOpen && 'rotate-180')}
                    />
                  </button>
                  {isOpen ? (
                    <p className="parkcore-reveal border-t border-border-subtle px-5 pb-6 pt-4 text-sm leading-relaxed text-foreground-secondary sm:px-6">
                      {es ? faq.answerEs : faq.answerEn}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-surface-inverse px-4 py-20 text-foreground-on-inverse sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ReceiptText aria-hidden="true" className="mx-auto size-8 text-accent" />
          <h2 className="mt-6 font-display text-4xl font-bold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
            {es
              ? 'Que la cochera vuelva a ser un lugar simple de usar.'
              : 'Let parking become simple to use again.'}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground-on-inverse/75 sm:text-lg">
            {es
              ? 'Entrá a la demo de operador o encontrá una cochera cerca. Los dos caminos empiezan sin fricción.'
              : 'Enter the operator demo or find a nearby facility. Both paths start without friction.'}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <DemoLoginButton
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
              onSuccess={() => {
                void navigate('/app', { replace: true });
              }}
            >
              {es ? 'Probar como operador' : 'Try as an operator'}
            </DemoLoginButton>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-foreground-on-inverse/50 px-6 py-3 text-sm font-bold text-foreground-on-inverse transition-colors hover:bg-foreground-on-inverse hover:text-surface-inverse"
              to="/parkings"
            >
              {es ? 'Buscar cocheras' : 'Browse facilities'}
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-surface-inverse px-4 py-10 text-foreground-on-inverse sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 border-t border-foreground-on-inverse/20 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="inline-flex font-display text-xl font-bold tracking-tight" to="/">
              PARKCORE
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground-on-inverse/70">
              {es
                ? 'Para estacionar, cobrar y llevar una cochera con los pies en la tierra.'
                : 'For parking, billing, and running a facility with both feet on the ground.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
            <Link className="hover:text-accent" to="/parkings">
              {es ? 'Cocheras' : 'Facilities'}
            </Link>
            <Link className="hover:text-accent" to="/login">
              {es ? 'Ingresar' : 'Sign in'}
            </Link>
            <span className="text-foreground-on-inverse/70">
              © {new Date().getFullYear()} ParkCore
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeaturedFacilities({
  es,
  query,
}: {
  es: boolean;
  query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof getPublicParkings>>>>;
}) {
  if (query.isLoading) {
    return (
      <div
        aria-label={es ? 'Cargando cocheras' : 'Loading facilities'}
        className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div
            className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface"
            key={index}
          >
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="space-y-4 p-6">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mt-12">
        <ErrorState
          onRetry={() => {
            void query.refetch();
          }}
          title={es ? 'No pudimos cargar las cocheras' : 'We could not load facilities'}
        >
          {es
            ? 'No ocultamos el problema con datos de muestra. Probá de nuevo o explorá el directorio.'
            : 'We do not hide the problem with sample data. Try again or explore the directory.'}
        </ErrorState>
      </div>
    );
  }

  const facilities = query.data?.data ?? [];
  if (facilities.length === 0) {
    return (
      <div className="mt-12 rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface-subtle p-8 text-center">
        <p className="type-label text-foreground-muted">
          {es ? 'Todavía no hay cocheras' : 'No facilities yet'}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-foreground-secondary">
          {es
            ? 'El directorio se va a completar cuando haya cocheras activas para publicar.'
            : 'The directory will fill in as active facilities become available.'}
        </p>
        <Link
          className="mt-5 inline-flex text-sm font-bold underline decoration-accent decoration-2 underline-offset-4"
          to="/parkings"
        >
          {es ? 'Abrir el directorio' : 'Open the directory'}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {facilities.map((parking) => (
        <ParkingDiscoveryCard key={parking.id} parking={parking} to={`/parkings/${parking.id}`} />
      ))}
    </div>
  );
}
