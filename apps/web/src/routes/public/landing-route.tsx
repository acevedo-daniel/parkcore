import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, ChevronDown, MapPin, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { DemoLoginButton } from '../../features/auth/demo-login-button.js';
import { ParkingCalculatorWidget } from '../../features/parking/parking-calculator-widget.js';
import { getPublicParkings, type PublicParking } from '../../lib/api/public-api.js';
import { cn } from '../../lib/cn.js';
import { useDocumentMeta } from '../../lib/document-meta.js';
import { formatMoney } from '../../lib/format.js';

const FALLBACK_PARKINGS: PublicParking[] = [
  {
    address: 'Av. Corrientes 1050, San Nicolás',
    capacity: 120,
    createdAt: new Date().toISOString(),
    currency: 'USD',
    description: null,
    hourlyRateCents: 1500,
    id: 'mock-1',
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
    id: 'mock-2',
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
    id: 'mock-3',
    image: null,
    isActive: true,
    lat: -34.6087,
    lng: -58.3644,
    ownerId: 'owner-3',
    title: 'Puerto Madero Dique 3',
    updatedAt: new Date().toISOString(),
  },
];

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

  const featuredParkings =
    parkingsQuery.data && parkingsQuery.data.data.length > 0
      ? parkingsQuery.data.data
      : FALLBACK_PARKINGS;

  return (
    <div className="landing-page overflow-hidden bg-white text-[#121417]">
      <section className="bg-[#ffcc00]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-8">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#121417]/15 bg-white/70 px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-[#121417] uppercase">
              <span className="size-1.5 rounded-full bg-[#121417]" />
              {es ? 'Para quienes se mueven todos los días' : 'For everyday movement'}
            </p>
            <h1 className="mt-7 max-w-3xl font-display text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[#121417] sm:text-6xl lg:text-[5.1rem]">
              {es ? (
                <>
                  La cochera se siente
                  <br />
                  distinta cuando todo
                  <br />
                  está en su lugar.
                </>
              ) : (
                <>
                  Parking feels different
                  <br />
                  when everything has
                  <br />
                  its place.
                </>
              )}
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-[#2f2f2f] sm:text-xl">
              {es
                ? 'ParkCore ordena la entrada, el cobro y el historial de una cochera. Para que llegar, estacionar y salir vuelva a ser algo simple.'
                : 'ParkCore brings order to a facility’s entry, payment, and history—so arriving, parking, and leaving can feel simple again.'}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/parkings"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#121417] px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-white hover:text-[#121417] active:translate-y-0"
              >
                {es ? 'Ver cocheras' : 'Browse facilities'}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
              <DemoLoginButton
                onSuccess={() => {
                  void navigate('/app', { replace: true });
                }}
                className="min-h-12 rounded-full border border-[#121417]/20 bg-white px-6 py-3 text-sm font-bold text-[#121417] transition-colors hover:bg-[#121417] hover:text-white"
              >
                {es ? 'Recorrer la demo' : 'Explore the demo'}
              </DemoLoginButton>
            </div>
            <p className="mt-8 text-sm leading-relaxed text-[#2f2f2f]">
              {es
                ? 'Sin depender de tickets de papel. Sin hacer más difícil una tarea cotidiana.'
                : 'No dependence on paper tickets. No need to make an everyday task harder.'}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div>
              <ParkingCalculatorWidget />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
                {es ? 'Una experiencia cotidiana' : 'An everyday experience'}
              </p>
              <h2 className="mt-4 font-display text-4xl font-black leading-[1.02] tracking-[-0.045em] text-[#121417] sm:text-5xl">
                {es
                  ? 'No hace falta reinventar la cochera. Hace falta volverla clara.'
                  : 'Parking does not need reinventing. It needs to be clear.'}
              </h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-[#3f3f3f] lg:col-span-5 lg:col-start-8 sm:text-lg">
              {es
                ? 'La tecnología está para sacar ruido del camino: que la tarifa se entienda, que la entrada quede registrada y que nadie tenga que buscar un papel al salir.'
                : 'Technology should remove noise: make rates understandable, record each arrival, and keep nobody looking for a scrap of paper at the exit.'}
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-[#121417]/10 bg-[#121417]/10 md:grid-cols-3">
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
                bodyEn: 'A clear closeout, with no rituals or hidden information.',
              },
            ].map((item) => (
              <article key={item.number} className="min-h-64 bg-white p-7 sm:p-8">
                <span className="font-mono text-xs font-bold text-[#121417]">{item.number}</span>
                <h3 className="mt-12 max-w-48 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-[#121417]">
                  {es ? item.titleEs : item.titleEn}
                </h3>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#526052]">
                  {es ? item.bodyEs : item.bodyEn}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#121417]/10 bg-[#f5f5f5] py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <article className="rounded-[2rem_2rem_5rem_2rem] bg-white p-8 shadow-[0_12px_0_rgba(18,20,23,0.09)] sm:p-10">
            <span className="inline-flex rounded-full bg-[#ffcc00] px-3 py-1.5 text-xs font-bold text-[#121417]">
              {es ? 'Para quien maneja' : 'For drivers'}
            </span>
            <h2 className="mt-7 max-w-md font-display text-3xl font-black leading-[1.04] tracking-[-0.04em] text-[#1d241f] sm:text-4xl">
              {es
                ? 'Dejá de adivinar cómo va a ser estacionar.'
                : 'Stop guessing what parking will be like.'}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#3f3f3f]">
              {es
                ? 'Consultá las cocheras, entendé la tarifa y guardá el comprobante de una estadía en el mismo lugar.'
                : 'Browse facilities, understand the rate, and keep a stay receipt in one place.'}
            </p>
            <Link
              to="/parkings"
              className="mt-9 inline-flex items-center gap-2 text-sm font-bold text-[#121417] underline decoration-[#ffcc00] decoration-2 underline-offset-4 hover:text-[#121417]"
            >
              {es ? 'Buscar una cochera' : 'Find a facility'}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </article>

          <article className="rounded-[5rem_2rem_2rem_2rem] bg-[#121417] p-8 text-white shadow-[0_12px_0_rgba(18,20,23,0.14)] sm:p-10">
            <span className="inline-flex rounded-full bg-[#ffcc00] px-3 py-1.5 text-xs font-bold text-[#121417]">
              {es ? 'Para quien abre la persiana' : 'For facility operators'}
            </span>
            <h2 className="mt-7 max-w-md font-display text-3xl font-black leading-[1.04] tracking-[-0.04em] sm:text-4xl">
              {es
                ? 'Que el trabajo de todos los días deje de depender de la memoria.'
                : 'Let everyday work stop depending on memory.'}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#f5f5f5]">
              {es
                ? 'Cada ingreso, cobro y salida queda a la vista. La operación conserva el ritmo de la cochera, no el de una planilla.'
                : 'Every entry, payment, and exit stays visible. The operation keeps the rhythm of the facility, not a spreadsheet.'}
            </p>
            <DemoLoginButton
              onSuccess={() => {
                void navigate('/app', { replace: true });
              }}
              className="mt-9 rounded-full bg-[#ffcc00] px-5 py-3 text-sm font-bold text-[#121417] transition-colors hover:bg-white"
            >
              {es ? 'Ver una jornada de ejemplo' : 'See an example day'}
            </DemoLoginButton>
          </article>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
                {es ? 'Cerca de donde vas' : 'Near where you are going'}
              </p>
              <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.045em] text-[#121417] sm:text-5xl">
                {es ? 'Elegí el lugar, no el misterio.' : 'Choose the place, not the mystery.'}
              </h2>
            </div>
            <Link
              to="/parkings"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#121417] underline decoration-[#ffcc00] decoration-2 underline-offset-4"
            >
              {es ? 'Ver todas las cocheras' : 'See all facilities'}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredParkings.map((parking) => (
              <Link
                key={parking.id}
                to={parking.id.startsWith('mock-') ? '/parkings' : `/parkings/${parking.id}`}
                className="group flex min-h-72 flex-col justify-between rounded-[2rem] border border-[#121417]/10 bg-white p-7 transition-transform hover:-translate-y-1 hover:shadow-[0_8px_0_rgba(18,20,23,0.08)]"
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
                  <h3 className="mt-12 max-w-64 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-[#1d241f]">
                    {parking.title}
                  </h3>
                  <p className="mt-3 flex max-w-64 items-start gap-2 text-sm leading-relaxed text-[#3f3f3f]">
                    <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#121417]" />
                    {parking.address}
                  </p>
                </div>
                <div className="mt-10 flex items-end justify-between border-t border-[#121417]/10 pt-5">
                  <span>
                    <span className="block text-xs font-medium text-[#526052]">
                      {es ? 'Desde' : 'From'}
                    </span>
                    <span className="font-mono text-lg font-bold text-[#1d241f]">
                      {formatMoney(parking.hourlyRateCents, parking.currency)}
                      <span className="text-xs font-medium"> / h</span>
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1d241f]">
                    {es ? 'Conocer' : 'Explore'}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#ffcc00] py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8">
          <div className="lg:col-span-5">
            <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
              {es ? 'La operación, sin teatro' : 'Operations, without theatre'}
            </p>
            <h2 className="mt-4 font-display text-4xl font-black leading-[1.02] tracking-[-0.045em] text-[#121417] sm:text-5xl">
              {es
                ? 'Tres momentos. Una historia que se puede seguir.'
                : 'Three moments. One story you can follow.'}
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[#121417] sm:text-lg">
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
              <li key={item.labelEs} className="flex gap-5 rounded-[1.75rem] bg-white p-5 sm:p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#121417] font-mono text-sm font-bold text-[#ffcc00]">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-[#1d241f]">
                    {es ? item.labelEs : item.labelEn}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#3f3f3f]">
                    {es ? item.textEs : item.textEn}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
              {es ? 'Preguntas que aparecen en la puerta' : 'Questions that come up at the door'}
            </p>
            <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.045em] text-[#121417] sm:text-5xl">
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
                  key={faq.questionEs}
                  className="overflow-hidden rounded-[1.5rem] border border-[#121417]/10 bg-white"
                >
                  <button
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-5 p-5 text-left font-display text-base font-bold text-[#121417] transition-colors hover:bg-[#f5f5f5] active:bg-[#ebe8df] sm:p-6"
                    onClick={() => {
                      setOpenFaqIndex(isOpen ? null : index);
                    }}
                    type="button"
                  >
                    <span>{es ? faq.questionEs : faq.questionEn}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        'size-5 shrink-0 text-[#121417] transition-transform',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <p className="parkcore-reveal border-t border-[#1d241f]/10 px-5 pb-6 pt-4 text-sm leading-relaxed text-[#526052] sm:px-6">
                      {es ? faq.answerEs : faq.answerEn}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#121417] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ReceiptText aria-hidden="true" className="mx-auto size-8 text-[#ffcc00]" />
          <h2 className="mt-6 font-display text-4xl font-black leading-[1.02] tracking-[-0.045em] sm:text-5xl">
            {es
              ? 'Que la cochera vuelva a ser un lugar simple de usar.'
              : 'Let parking become simple to use again.'}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#f5f5f5] sm:text-lg">
            {es
              ? 'Entrá a la demo de operador o encontrá una cochera cerca. Los dos caminos empiezan sin fricción.'
              : 'Enter the operator demo or find a nearby facility. Both paths start without friction.'}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <DemoLoginButton
              onSuccess={() => {
                void navigate('/app', { replace: true });
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#ffcc00] px-6 py-3 text-sm font-bold text-[#121417] transition-colors hover:bg-white"
            >
              {es ? 'Probar como operador' : 'Try as an operator'}
            </DemoLoginButton>
            <Link
              to="/parkings"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/50 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#121417]"
            >
              {es ? 'Buscar cocheras' : 'Browse facilities'}
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#121417] px-4 py-10 text-[#f5f5f5] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 border-t border-white/20 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              className="inline-flex items-center gap-2 font-display text-xl font-black tracking-tight text-white"
              to="/"
            >
              PARKCORE
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#d4d4d4]">
              {es
                ? 'Para estacionar, cobrar y llevar una cochera con los pies en la tierra.'
                : 'For parking, billing, and running a facility with both feet on the ground.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
            <Link className="hover:text-[#ffcc00]" to="/parkings">
              {es ? 'Cocheras' : 'Facilities'}
            </Link>
            <Link className="hover:text-[#ffcc00]" to="/login">
              {es ? 'Ingresar' : 'Sign in'}
            </Link>
            <span className="text-[#d4d4d4]">© {new Date().getFullYear()} ParkCore</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
