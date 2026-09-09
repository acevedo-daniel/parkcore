import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Car,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  Receipt,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
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
    questionEs: '¿Necesito descargar alguna app para estacionar?',
    questionEn: 'Do I need to download an app to park?',
    answerEs:
      'No. ParkCore funciona 100% en la web y en los accesos de las cocheras. Podés ingresar mediante lectura de patente automática o escaneando un código QR con la cámara de tu teléfono.',
    answerEn:
      'No. ParkCore works 100% on the web and at facility gates. You can enter via automatic license plate recognition or by scanning a QR code with your phone camera.',
  },
  {
    questionEs: '¿Cómo se calcula el precio de mi estadía?',
    questionEn: 'How is my stay priced?',
    answerEs:
      'El cálculo es justo y transparente. Pagás la tarifa horaria publicada con fraccionamiento exacto. Nunca te cobramos horas enteras de más por quedarte unos minutos.',
    answerEn:
      'Pricing is fair and transparent. You pay the posted hourly rate with exact fractional billing. You are never overcharged for full extra hours.',
  },
  {
    questionEs: '¿Qué pasa si pierdo el comprobante o el ticket?',
    questionEn: 'What if I lose my ticket or receipt?',
    answerEs:
      'Como tu estadía está vinculada a tu patente o teléfono, no existen los tickets de papel perdidos ni penalidades abusivas. Podés consultar y pagar tu estadía en cualquier momento.',
    answerEn:
      'Because your stay is linked to your plate or mobile session, paper tickets and unfair penalties are completely eliminated. Check your balance anytime.',
  },
  {
    questionEs: 'Tengo una cochera, ¿cómo empiezo a operar con ParkCore?',
    questionEn: 'I own a parking facility, how do I get started?',
    answerEs:
      'Podés probar la demo de operador en un clic sin costo. Configurar tu cochera, definir tarifas y registrar estadías toma menos de 3 minutos desde cualquier tablet, PC o teléfono.',
    answerEn:
      'You can test the operator demo with one click. Setting up your facility, defining rates, and logging stays takes less than 3 minutes on any tablet, PC, or phone.',
  },
];

export function LandingRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useDocumentMeta({
    description: es
      ? 'Estacioná fácil, pagá lo justo y gestioná tu cochera sin vueltas ni sorpresas. Plataforma de cocheras digitales ParkCore.'
      : 'Park easily, pay fair, and manage parking spaces without hassle. ParkCore digital parking platform.',
    title: es ? 'ParkCore | Estacioná fácil y sin vueltas' : 'ParkCore | Easy, transparent parking',
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

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="landing-page flex flex-col bg-white text-[#121417]">
      {/* =========================================================================
          HERO SECTION (Wise-style Full-Bleed Curbside Yellow)
      ========================================================================= */}
      <section className="relative w-full overflow-hidden bg-[#ffcc00] text-[#121417] pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-32">
        {/* Subtle decorative background curves */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-[640px] rounded-full border-[48px] border-black/5 opacity-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-48 bottom-0 size-[480px] rounded-full border-[32px] border-black/5 opacity-40"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Bold Headline, Warm Copy, Chunky Pill CTA */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/10 px-4 py-1.5 text-xs font-bold tracking-wide text-[#121417] backdrop-blur-xs">
                <span className="size-2 rounded-full bg-[#121417]" />
                {es ? 'La nueva forma de estacionar' : 'The modern way to park'}
              </div>

              <h1 className="font-display text-4xl sm:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight leading-[1.05] text-[#121417]">
                {es ? (
                  <>
                    Estacioná fácil.
                    <br />
                    Pagá lo justo.
                    <br />
                    <span className="underline decoration-black/30 decoration-wavy underline-offset-8">
                      Sin vueltas.
                    </span>
                  </>
                ) : (
                  <>
                    Park easy.
                    <br />
                    Pay fair.
                    <br />
                    <span className="underline decoration-black/30 decoration-wavy underline-offset-8">
                      Zero hassle.
                    </span>
                  </>
                )}
              </h1>

              <p className="max-w-xl text-lg sm:text-xl font-medium text-[#121417]/85 leading-relaxed">
                {es
                  ? 'Encontrá lugar al instante, ingresá con tu patente y pagá solo por el tiempo exacto que te quedás. Sin boletos perdidos ni colas al salir.'
                  : 'Find spots in real time, enter with your license plate, and pay only for the exact minutes parked. No paper tickets, no exit queues.'}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                <Link
                  to="/parkings"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#121417] px-8 py-4 font-display text-base font-bold text-white shadow-md transition-all hover:bg-black hover:scale-[1.02] active:scale-[0.99]"
                >
                  <span>{es ? 'Buscar cocheras' : 'Explore parkings'}</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>

                <DemoLoginButton
                  onSuccess={() => {
                    void navigate('/app', { replace: true });
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-white/80 px-7 py-4 font-display text-base font-bold text-[#121417] backdrop-blur-xs border border-black/10 transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.99]"
                >
                  {es ? 'Probar demo operador' : 'Try operator demo'}
                </DemoLoginButton>
              </div>

              {/* Trust bullets */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm font-semibold text-[#121417]/80">
                <span className="flex items-center gap-1.5">
                  <Check aria-hidden="true" className="size-4 text-[#121417]" />
                  {es ? 'Sin descargar apps' : 'No app required'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check aria-hidden="true" className="size-4 text-[#121417]" />
                  {es ? 'Tarifa exacta por minuto' : 'Exact minute billing'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check aria-hidden="true" className="size-4 text-[#121417]" />
                  {es ? 'Acceso 100% digital' : '100% digital access'}
                </span>
              </div>
            </div>

            {/* Right Column: Hero Interactive Calculator Widget (Wise Style) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <ParkingCalculatorWidget />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STATS & CONFIDENCE RIBBON
      ========================================================================= */}
      <section className="w-full border-b border-black/8 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            <div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#121417] tracking-tight">
                45.000+
              </p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-[#404550]">
                {es ? 'Estadías gestionadas' : 'Stays handled'}
              </p>
            </div>
            <div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#10b981] tracking-tight">
                0 seg
              </p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-[#404550]">
                {es ? 'Perdidos buscando tickets' : 'Lost finding paper tickets'}
              </p>
            </div>
            <div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#121417] tracking-tight">
                100%
              </p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-[#404550]">
                {es ? 'Cobro exacto sin recargos' : 'Transparent pricing'}
              </p>
            </div>
            <div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#121417] tracking-tight">
                4.9 / 5
              </p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-[#404550]">
                {es ? 'Satisfacción de usuarios' : 'Customer satisfaction'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HOW IT WORKS: 3 SIMPLE STEPS
      ========================================================================= */}
      <section className="w-full bg-[#f7f8f5] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ffcc00] bg-[#121417] px-3 py-1 rounded-full inline-block mb-3">
              {es ? 'Así de fácil' : 'How it works'}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#121417] tracking-tight">
              {es
                ? 'De la calle a tu lugar en 3 simples pasos'
                : 'From the street to your spot in 3 easy steps'}
            </h2>
            <p className="mt-3 text-base text-[#404550]">
              {es
                ? 'Diseñado para que ni te acuerdes de que estás estacionando.'
                : 'Engineered so you never have to think about parking logistics again.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="rounded-[28px] bg-white p-8 shadow-xs border border-black/5 hover:-translate-y-1 transition-all duration-200">
              <div className="size-14 rounded-2xl bg-[#fff8db] flex items-center justify-center text-[#121417] mb-6">
                <Car aria-hidden="true" className="size-7 text-[#121417]" />
              </div>
              <span className="font-mono text-xs font-bold text-[#ffcc00] bg-[#121417] px-2.5 py-0.5 rounded-full">
                Paso 01
              </span>
              <h3 className="mt-3 font-display text-xl font-bold text-[#121417]">
                {es ? 'Llegás y entrás' : 'Arrive and drive in'}
              </h3>
              <p className="mt-2 text-sm text-[#404550] leading-relaxed">
                {es
                  ? 'La cámara lee tu patente al instante o escaneás el código QR de entrada. La barrera se abre y tu estadía queda registrada al segundo.'
                  : 'License plate camera scans on entry or you scan the arrival QR code. Barrier opens and your session begins to the exact second.'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-[28px] bg-white p-8 shadow-xs border border-black/5 hover:-translate-y-1 transition-all duration-200">
              <div className="size-14 rounded-2xl bg-[#fff8db] flex items-center justify-center text-[#121417] mb-6">
                <Clock aria-hidden="true" className="size-7 text-[#121417]" />
              </div>
              <span className="font-mono text-xs font-bold text-[#ffcc00] bg-[#121417] px-2.5 py-0.5 rounded-full">
                Paso 02
              </span>
              <h3 className="mt-3 font-display text-xl font-bold text-[#121417]">
                {es ? 'Tu auto seguro' : 'Your vehicle is secure'}
              </h3>
              <p className="mt-2 text-sm text-[#404550] leading-relaxed">
                {es
                  ? 'Podés consultar tu tiempo transcurrido y tarifa acumulada en cualquier momento desde tu teléfono. Cero sorpresas de precios.'
                  : 'Check your elapsed time and accrued fee anytime right on your phone. Transparent rates, zero price surprises.'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-[28px] bg-white p-8 shadow-xs border border-black/5 hover:-translate-y-1 transition-all duration-200">
              <div className="size-14 rounded-2xl bg-[#fff8db] flex items-center justify-center text-[#121417] mb-6">
                <Receipt aria-hidden="true" className="size-7 text-[#121417]" />
              </div>
              <span className="font-mono text-xs font-bold text-[#ffcc00] bg-[#121417] px-2.5 py-0.5 rounded-full">
                Paso 03
              </span>
              <h3 className="mt-3 font-display text-xl font-bold text-[#121417]">
                {es ? 'Salís sin demoras' : 'Exit in seconds'}
              </h3>
              <p className="mt-2 text-sm text-[#404550] leading-relaxed">
                {es
                  ? 'Pagás de forma digital o en caja rápida. Al acercarte a la salida, la barrera te reconoce y salís volando con tu comprobante digital.'
                  : 'Pay digitally or at the fast-lane register. The exit recognizes your plate and you roll out with your digital receipt.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DUAL VALUE PROPOSITION (Drivers vs. Facility Owners)
      ========================================================================= */}
      <section className="w-full bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#121417] tracking-tight">
              {es
                ? 'Hecho para quienes manejan y para quienes gestionan'
                : 'Built for those who drive and those who operate'}
            </h2>
            <p className="mt-3 text-base text-[#404550]">
              {es
                ? 'Una solución integral que une la experiencia del conductor con el control del negocio.'
                : 'A seamless platform bringing driver convenience and operational profit together.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Card 1: For Drivers (Warm Yellow / Clean White card) */}
            <div className="rounded-[32px] bg-[#fff9db] border border-[#ffec99] p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#121417] px-3.5 py-1 text-xs font-bold text-white">
                  <Smartphone aria-hidden="true" className="size-3.5" />
                  {es ? 'Para Conductores' : 'For Drivers'}
                </div>
                <h3 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-[#121417]">
                  {es
                    ? 'Estacioná rápido y olvidate del estrés de buscar lugar'
                    : 'Park fast and leave parking anxiety behind'}
                </h3>
                <ul className="mt-6 space-y-4 text-sm sm:text-base text-[#404550]">
                  <li className="flex items-start gap-3">
                    <Check aria-hidden="true" className="size-5 text-[#121417] shrink-0 mt-0.5" />
                    <span>
                      <strong>{es ? 'Lugares en tiempo real:' : 'Real-time spots:'}</strong>{' '}
                      {es
                        ? 'Sabés si hay disponibilidad antes de llegar a la puerta.'
                        : 'Know if spots are open before you arrive at the gate.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check aria-hidden="true" className="size-5 text-[#121417] shrink-0 mt-0.5" />
                    <span>
                      <strong>{es ? 'Fraccionamiento justo:' : 'Fair billing:'}</strong>{' '}
                      {es
                        ? 'Nunca más pagues dos horas por haber estado 65 minutos.'
                        : 'Never get billed for 2 hours when you stayed 65 minutes.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check aria-hidden="true" className="size-5 text-[#121417] shrink-0 mt-0.5" />
                    <span>
                      <strong>{es ? 'Comprobantes al instante:' : 'Instant receipts:'}</strong>{' '}
                      {es
                        ? 'Tus recibos guardados digitalmente para rendir o tener el control.'
                        : 'All invoices stored digitally for easy expense reports.'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#ffec99]">
                <Link
                  to="/parkings"
                  className="inline-flex items-center gap-2 font-display text-base font-bold text-[#121417] hover:underline"
                >
                  <span>{es ? 'Ver cocheras habilitadas' : 'View open parkings'}</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: For Owners (Deep Ink Dark card) */}
            <div className="rounded-[32px] bg-[#121417] text-white p-8 sm:p-10 flex flex-col justify-between shadow-xl">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#ffcc00] px-3.5 py-1 text-xs font-bold text-[#121417]">
                  <Zap aria-hidden="true" className="size-3.5 fill-[#121417]" />
                  {es ? 'Para Dueños de Cocheras' : 'For Parking Owners'}
                </div>
                <h3 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-white">
                  {es
                    ? 'Digitalizá tu cochera y aumentá tu recaudación'
                    : 'Digitize your facility and boost your revenue'}
                </h3>
                <ul className="mt-6 space-y-4 text-sm sm:text-base text-gray-300">
                  <li className="flex items-start gap-3">
                    <Check aria-hidden="true" className="size-5 text-[#ffcc00] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">
                        {es ? 'Cero fugas de caja:' : 'Zero cash leaks:'}
                      </strong>{' '}
                      {es
                        ? 'Cada vehículo que entra y sale queda registrado de forma inalterable.'
                        : 'Every vehicle arrival and exit is tracked immutably.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check aria-hidden="true" className="size-5 text-[#ffcc00] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">
                        {es ? 'Ocupación al máximo:' : 'Maximized throughput:'}
                      </strong>{' '}
                      {es
                        ? 'Mayor rotación de vehículos y menos filas en la puerta de entrada.'
                        : 'Higher vehicle turnaround with zero bottleneck queues.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check aria-hidden="true" className="size-5 text-[#ffcc00] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">
                        {es ? 'Control desde el móvil:' : 'Mobile command:'}
                      </strong>{' '}
                      {es
                        ? 'Mirá cuántos autos tenés adentro y cuánto recaudaste desde donde estés.'
                        : 'Check active spots and daily revenue wherever you are.'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <DemoLoginButton
                  onSuccess={() => {
                    void navigate('/app', { replace: true });
                  }}
                  className="inline-flex items-center gap-2 font-display text-base font-bold text-[#ffcc00] hover:underline"
                >
                  <span>{es ? 'Entrar a la demo de operador' : 'Launch operator demo'}</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </DemoLoginButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURED REAL FACILITIES CATALOG
      ========================================================================= */}
      <section className="w-full bg-[#f7f8f5] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#ffcc00] bg-[#121417] px-3 py-1 rounded-full inline-block mb-3">
                {es ? 'Red ParkCore' : 'ParkCore Network'}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#121417] tracking-tight">
                {es ? 'Cocheras conectadas en vivo' : 'Live connected facilities'}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#404550]">
                {es
                  ? 'Ingresá con tu patente y disfrutá de la tarifa justa.'
                  : 'Roll in with your plate and enjoy guaranteed fair rates.'}
              </p>
            </div>
            <Link
              to="/parkings"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#121417] hover:underline"
            >
              <span>{es ? 'Ver catálogo completo' : 'View all facilities'}</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredParkings.map((parking) => (
              <Link
                key={parking.id}
                to={parking.id.startsWith('mock-') ? '/parkings' : `/parkings/${parking.id}`}
                className="group flex flex-col justify-between rounded-[28px] bg-white p-6 sm:p-7 shadow-xs border border-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-bold text-[#166534]">
                      <span className="size-1.5 rounded-full bg-[#16a34a] animate-pulse" />
                      {es ? 'Lugares disponibles' : 'Spots open'}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#404550]">
                      {parking.capacity} {es ? 'plazas' : 'total'}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-[#121417] group-hover:text-[#b45309] transition-colors">
                    {parking.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#404550] line-clamp-1">
                    <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-[#717684]" />
                    <span>{parking.address}</span>
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-black/8 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-medium text-[#717684]">
                      {es ? 'Tarifa por hora' : 'Hourly rate'}
                    </span>
                    <span className="font-display text-xl font-bold text-[#121417]">
                      {formatMoney(parking.hourlyRateCents, parking.currency)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#121417] group-hover:underline">
                    {es ? 'Ver cochera' : 'View spot'}
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE TRANSPARENCY COMPARISON (Wise "No Hidden Fees" Pattern)
      ========================================================================= */}
      <section className="w-full bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#121417] tracking-tight">
              {es
                ? 'El estacionamiento tradicional vs. ParkCore'
                : 'Traditional parking vs. ParkCore'}
            </h2>
            <p className="mt-3 text-base text-[#404550]">
              {es
                ? 'Por qué miles de conductores y dueños de cocheras nunca vuelven al sistema de papel.'
                : 'Why thousands of drivers and facility owners will never go back to paper tickets.'}
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-[32px] border border-black/8 overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Old Traditional */}
              <div className="bg-[#fcfbf9] p-8 sm:p-10 border-b md:border-b-0 md:border-r border-black/8">
                <h3 className="font-display text-xl font-bold text-[#717684] pb-4 border-b border-black/8">
                  {es ? 'Estacionamiento Tradicional' : 'Traditional Parking'}
                </h3>
                <ul className="mt-6 space-y-5 text-sm text-[#404550]">
                  <li className="flex items-start gap-3">
                    <span className="size-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span>
                      {es
                        ? 'Boleto de papel que se pierde en el bolsillo y te cobran día completo de penalidad.'
                        : 'Paper ticket gets lost and you get charged a harsh full-day penalty.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="size-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span>
                      {es
                        ? 'Redondeo abusivo: si estuviste 1 hora y 5 minutos te cobran 2 horas enteras.'
                        : 'Unfair roundups: if you parked for 1h 5m, they bill you for 2 full hours.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="size-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span>
                      {es
                        ? 'Colas en la garita, búsqueda desesperada de efectivo o cambio chico.'
                        : 'Queuing up at the booth, scrambling for exact cash or small change.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="size-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span>
                      {es
                        ? 'Incertidumbre total: das vueltas a la manzana rezando que haya un lugar libre.'
                        : 'Total uncertainty: circling blocks hoping to spot an open sign.'}
                    </span>
                  </li>
                </ul>
              </div>

              {/* ParkCore Way */}
              <div className="bg-[#fff9db] p-8 sm:p-10">
                <div className="flex items-center justify-between pb-4 border-b border-[#ffec99]">
                  <h3 className="font-display text-xl font-bold text-[#121417]">ParkCore</h3>
                  <span className="rounded-full bg-[#121417] text-[#ffcc00] px-3 py-0.5 text-xs font-bold">
                    {es ? 'El estándar' : 'The standard'}
                  </span>
                </div>
                <ul className="mt-6 space-y-5 text-sm text-[#121417]">
                  <li className="flex items-start gap-3">
                    <span className="size-5 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>
                      <strong>{es ? 'Acceso con patente o QR:' : 'Plate or QR scan:'}</strong>{' '}
                      {es
                        ? 'Imposible de perder. Vinculado directamente a tu estadía digital.'
                        : 'Impossible to lose. Tied directly to your live session.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="size-5 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>
                      <strong>
                        {es ? 'Fraccionamiento transparente:' : 'Fair minute pricing:'}
                      </strong>{' '}
                      {es
                        ? 'Pagás exactamente por el tiempo que ocupaste el espacio.'
                        : 'You only pay for the exact time your car is inside.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="size-5 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>
                      <strong>{es ? 'Salida exprés:' : 'Express checkout:'}</strong>{' '}
                      {es
                        ? 'Pagás desde el móvil o en terminal rápido y salís sin hacer fila.'
                        : 'Pay from your phone or fast checkout and drive right out.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="size-5 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>
                      <strong>{es ? 'Disponibilidad garantizada:' : 'Live availability:'}</strong>{' '}
                      {es
                        ? 'Mirás los lugares libres en tiempo real antes de mover el auto.'
                        : 'Check available spots in real time before even pulling out.'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ ACCORDION
      ========================================================================= */}
      <section className="w-full bg-[#f7f8f5] py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#121417] tracking-tight">
              {es ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#404550]">
              {es
                ? 'Todo lo que necesitás saber para empezar a estacionar o gestionar tu cochera.'
                : 'Everything you need to know about parking and managing spaces with ParkCore.'}
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white border border-black/5 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => {
                      toggleFaq(index);
                    }}
                    className="flex w-full items-center justify-between p-6 text-left font-display text-base sm:text-lg font-bold text-[#121417] hover:bg-[#fafaf7] transition-colors"
                  >
                    <span>{es ? faq.questionEs : faq.questionEn}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        'size-5 text-[#404550] transition-transform duration-200 shrink-0 ml-4',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="px-6 pb-6 text-sm text-[#404550] leading-relaxed border-t border-black/5 pt-4">
                      {es ? faq.answerEs : faq.answerEn}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL WISE-STYLE CALL TO ACTION BANNER
      ========================================================================= */}
      <section className="w-full bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[36px] bg-[#121417] text-white p-10 sm:p-16 lg:p-20 text-center overflow-hidden shadow-2xl">
            {/* Background ambient accents */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-[#ffcc00]/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full bg-[#ffcc00]/15 blur-3xl"
            />

            <div className="relative mx-auto max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffcc00] px-4 py-1 text-xs font-bold text-[#121417]">
                <Sparkles aria-hidden="true" className="size-3.5" />
                {es ? 'Sumate a la red ParkCore' : 'Join the ParkCore network'}
              </span>

              <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {es
                  ? 'Estacionar y cobrar nunca fue tan simple.'
                  : 'Parking and billing have never been this simple.'}
              </h2>

              <p className="text-base sm:text-lg text-gray-300 max-w-xl mx-auto leading-relaxed">
                {es
                  ? 'Miles de conductores ya ahorran tiempo y dinero cada día. Probá la plataforma hoy mismo sin costo.'
                  : 'Thousands of drivers already save time and money every day. Test the platform today with zero setup fees.'}
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <DemoLoginButton
                  onSuccess={() => {
                    void navigate('/app', { replace: true });
                  }}
                  className="rounded-full bg-[#ffcc00] px-8 py-4 font-display text-base font-bold text-[#121417] shadow-lg transition-all hover:bg-[#e6b800] hover:scale-105 active:scale-95"
                >
                  {es ? 'Probar demo de operador' : 'Launch operator demo'}
                </DemoLoginButton>

                <Link
                  to="/parkings"
                  className="rounded-full bg-white/10 px-8 py-4 font-display text-base font-bold text-white border border-white/20 transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                >
                  {es ? 'Buscar cocheras' : 'Find parkings'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FRIENDLY FOOTER (Wise-style)
      ========================================================================= */}
      <footer className="w-full border-t border-black/8 bg-[#f7f8f5] py-12 text-xs text-[#404550]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#ffcc00]" />
              <span className="font-display text-base font-bold text-[#121417]">PARKCORE</span>
              <span className="text-[#717684]">© {new Date().getFullYear()}</span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Link to="/parkings" className="hover:text-[#121417] transition-colors">
                {es ? 'Cocheras' : 'Parkings'}
              </Link>
              <Link to="/login" className="hover:text-[#121417] transition-colors">
                {es ? 'Ingreso Operador' : 'Operator Sign in'}
              </Link>
              <span className="text-[#717684]">
                {es ? 'Hecho con diseño y precisión' : 'Designed with precision'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
