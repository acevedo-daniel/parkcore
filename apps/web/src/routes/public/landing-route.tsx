import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, ReceiptText } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { ParkingDiscoveryCard } from '../../components/domain/parking-discovery-card.js';
import { EmptyState, ErrorState } from '../../components/domain/feedback.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion.js';
import { DemoLoginButton } from '../../features/auth/demo-login-button.js';
import { ParkingCalculatorWidget } from '../../features/parking/parking-calculator-widget.js';
import { getPublicParkings } from '../../lib/api/public-api.js';
import { useDocumentMeta } from '../../lib/document-meta.js';
import type { MessageKey } from '../../lib/localization.js';

interface FaqItem {
  answer: MessageKey;
  id: string;
  question: MessageKey;
}

const FAQS = [
  {
    answer: 'public.landing.faq.app.answer',
    id: 'app',
    question: 'public.landing.faq.app.question',
  },
  {
    answer: 'public.landing.faq.price.answer',
    id: 'price',
    question: 'public.landing.faq.price.question',
  },
  {
    answer: 'public.landing.faq.ticket.answer',
    id: 'ticket',
    question: 'public.landing.faq.ticket.question',
  },
  {
    answer: 'public.landing.faq.operator.answer',
    id: 'operator',
    question: 'public.landing.faq.operator.question',
  },
] as const satisfies readonly FaqItem[];

const HOW_IT_WORKS_ITEMS = [
  {
    body: 'public.landing.howItems.contextDescription',
    number: '01',
    title: 'public.landing.howItems.contextTitle',
  },
  {
    body: 'public.landing.howItems.paperDescription',
    number: '02',
    title: 'public.landing.howItems.paperTitle',
  },
  {
    body: 'public.landing.howItems.receiptDescription',
    number: '03',
    title: 'public.landing.howItems.receiptTitle',
  },
] as const satisfies readonly { body: MessageKey; number: string; title: MessageKey }[];

const OPERATION_ITEMS = [
  {
    body: 'public.landing.operationSteps.arrivalDescription',
    title: 'public.landing.operationSteps.arrivalTitle',
  },
  {
    body: 'public.landing.operationSteps.stayDescription',
    title: 'public.landing.operationSteps.stayTitle',
  },
  {
    body: 'public.landing.operationSteps.departureDescription',
    title: 'public.landing.operationSteps.departureTitle',
  },
] as const satisfies readonly { body: MessageKey; title: MessageKey }[];

export function LandingRoute() {
  const { t } = useAppearance();
  const location = useLocation();
  const navigate = useNavigate();

  useDocumentMeta({
    description: t('public.landing.metaDescription'),
    title: t('public.landing.metaTitle'),
  });

  useEffect(() => {
    if (location.hash !== '#como-funciona') return;
    const target = document.getElementById('como-funciona');
    if (!target || typeof target.scrollIntoView !== 'function') return;
    const scrollToTarget = () => {
      target.scrollIntoView({ block: 'start' });
    };
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(scrollToTarget);
    } else {
      scrollToTarget();
    }
  }, [location.hash]);

  const parkingsQuery = useQuery({
    queryKey: ['public-parkings-landing'],
    queryFn: () => getPublicParkings({ limit: 6 }),
    staleTime: 60_000,
  });

  return (
    <div className="landing-page overflow-hidden bg-background text-foreground">
      <section
        className="flex min-h-svh items-center bg-brand text-brand-foreground"
        data-slot="landing-hero"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div className="min-w-0 lg:col-span-7">
            <p className="type-label inline-flex items-center gap-2 rounded-full border border-brand-strong bg-brand/70 px-3 py-1.5 text-brand-foreground">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-foreground" />
              {t('public.landing.heroEyebrow')}
            </p>
            <h1 className="mt-7 min-w-0 max-w-full break-words font-display text-5xl font-bold leading-display tracking-display sm:text-6xl lg:text-display">
              {t('public.landing.heroTitle')}
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-brand-foreground/85 sm:text-xl">
              {t('public.landing.heroDescription')}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0"
                to="/parkings"
              >
                {t('public.landing.browseAction')}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
              <DemoLoginButton
                className="min-h-12 rounded-full border border-brand-strong bg-card px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-accent"
                onSuccess={() => {
                  void navigate('/app', { replace: true });
                }}
              >
                {t('public.landing.demoAction')}
              </DemoLoginButton>
            </div>
            <p className="mt-8 text-sm leading-relaxed text-brand-foreground/75">
              {t('public.landing.heroNote')}
            </p>
          </div>

          <div className="lg:col-span-5">
            <ParkingCalculatorWidget />
          </div>
        </div>
      </section>

      <section className="bg-card py-20 sm:py-28" id="como-funciona">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="type-label text-muted-foreground">{t('public.landing.howEyebrow')}</p>
              <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-heading sm:text-5xl">
                {t('public.landing.howTitle')}
              </h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-foreground-secondary lg:col-span-5 lg:col-start-8 sm:text-lg">
              {t('public.landing.howDescription')}
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {HOW_IT_WORKS_ITEMS.map((item) => (
              <article className="min-h-64 bg-card p-7 sm:p-8" key={item.number}>
                <span className="font-display text-xs font-bold tabular-nums text-muted-foreground">
                  {item.number}
                </span>
                <h3 className="mt-12 max-w-48 font-display text-2xl font-bold leading-tight tracking-title">
                  {t(item.title)}
                </h3>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground-secondary">
                  {t(item.body)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <article className="rounded-2xl bg-card p-8 shadow-md sm:p-10">
            <span className="inline-flex rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground">
              {t('public.landing.driverEyebrow')}
            </span>
            <h2 className="mt-7 max-w-md font-display text-3xl font-bold leading-tight tracking-heading sm:text-4xl">
              {t('public.landing.driverTitle')}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-foreground-secondary">
              {t('public.landing.driverDescription')}
            </p>
            <Link
              className="mt-9 inline-flex items-center gap-2 text-sm font-bold underline decoration-brand decoration-2 underline-offset-4"
              to="/parkings"
            >
              {t('public.landing.driverAction')}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </article>

          <article className="rounded-2xl bg-inverse p-8 text-inverse-foreground shadow-md sm:p-10">
            <span className="inline-flex rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground">
              {t('public.landing.operatorEyebrow')}
            </span>
            <h2 className="mt-7 max-w-md font-display text-3xl font-bold leading-tight tracking-heading sm:text-4xl">
              {t('public.landing.operatorTitle')}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-inverse-foreground/75">
              {t('public.landing.operatorDescription')}
            </p>
            <DemoLoginButton
              className="mt-9 rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
              onSuccess={() => {
                void navigate('/app', { replace: true });
              }}
            >
              {t('public.landing.operatorAction')}
            </DemoLoginButton>
          </article>
        </div>
      </section>

      <section className="bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="type-label text-muted-foreground">
                {t('public.landing.featuredEyebrow')}
              </p>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-heading sm:text-5xl">
                {t('public.landing.featuredTitle')}
              </h2>
            </div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold underline decoration-brand decoration-2 underline-offset-4"
              to="/parkings"
            >
              {t('public.landing.featuredAction')}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <FeaturedFacilities query={parkingsQuery} />
        </div>
      </section>

      <section className="bg-brand py-20 text-brand-foreground sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8">
          <div className="lg:col-span-5">
            <p className="type-label text-brand-foreground/75">
              {t('public.landing.operationsEyebrow')}
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-heading sm:text-5xl">
              {t('public.landing.operationsTitle')}
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed sm:text-lg">
              {t('public.landing.operationsDescription')}
            </p>
            <p className="mt-4 text-sm font-semibold text-brand-foreground/75">
              {t('public.landing.operationsNote')}
            </p>
          </div>
          <ol className="grid gap-4 lg:col-span-6 lg:col-start-7">
            {OPERATION_ITEMS.map((item, index) => (
              <li
                className="flex gap-5 rounded-xl bg-card p-5 text-foreground sm:p-6"
                key={item.title}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold tabular-nums text-primary-foreground">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">{t(item.title)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">
                    {t(item.body)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="type-label text-muted-foreground">{t('public.landing.faqEyebrow')}</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-heading sm:text-5xl">
              {t('public.landing.faqTitle')}
            </h2>
          </div>
          <Accordion
            className="mt-12 space-y-3"
            collapsible
            defaultValue={FAQS[0].id}
            type="single"
          >
            {FAQS.map((faq) => (
              <AccordionItem
                className="overflow-hidden rounded-xl border border-border bg-card"
                key={faq.id}
                value={faq.id}
              >
                <AccordionTrigger className="p-5 font-display text-base font-bold hover:bg-accent hover:no-underline sm:p-6">
                  {t(faq.question)}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="border-t border-border-subtle px-5 pb-6 pt-4 text-sm leading-relaxed text-foreground-secondary sm:px-6">
                    {t(faq.answer)}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="bg-inverse px-4 py-20 text-inverse-foreground sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ReceiptText aria-hidden="true" className="mx-auto size-8 text-brand" />
          <h2 className="mt-6 font-display text-4xl font-bold leading-tight tracking-heading sm:text-5xl">
            {t('public.landing.finalTitle')}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-inverse-foreground/75 sm:text-lg">
            {t('public.landing.finalDescription')}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <DemoLoginButton
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
              onSuccess={() => {
                void navigate('/app', { replace: true });
              }}
            >
              {t('public.landing.finalDemoAction')}
            </DemoLoginButton>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-inverse-foreground/50 px-6 py-3 text-sm font-bold text-inverse-foreground transition-colors hover:bg-inverse-foreground hover:text-inverse"
              to="/parkings"
            >
              {t('public.landing.finalBrowseAction')}
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-inverse px-4 py-10 text-inverse-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 border-t border-inverse-foreground/20 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="inline-flex font-display text-xl font-bold tracking-tight" to="/">
              PARKCORE
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-inverse-foreground/70">
              {t('public.landing.footerDescription')}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
            <Link className="hover:text-brand" to="/parkings">
              {t('public.landing.footerFacilities')}
            </Link>
            <Link className="hover:text-brand" to="/login">
              {t('public.landing.footerSignIn')}
            </Link>
            <span className="text-inverse-foreground/70">
              {t('public.landing.copyright', { year: new Date().getFullYear() })}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeaturedFacilities({
  query,
}: {
  query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof getPublicParkings>>>>;
}) {
  const { t } = useAppearance();
  if (query.isLoading) {
    return (
      <div
        aria-label={t('public.landing.loadingFacilities')}
        aria-busy="true"
        aria-live="polite"
        className="mt-12 grid gap-5 md:grid-cols-2 wide:grid-cols-3"
        role="status"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div className="overflow-hidden rounded-2xl border border-border bg-card" key={index}>
            <Skeleton className="aspect-4/3 rounded-none" />
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
          title={t('public.landing.errorTitle')}
        >
          {t('public.landing.errorDescription')}
        </ErrorState>
      </div>
    );
  }

  const facilities = query.data?.data ?? [];
  if (facilities.length === 0) {
    return (
      <EmptyState
        action={
          <Link
            className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline decoration-brand decoration-2 underline-offset-4"
            to="/parkings"
          >
            {t('public.landing.emptyAction')}
          </Link>
        }
        className="mt-10 rounded-xl border border-dashed border-border-strong bg-muted px-5 py-5 sm:px-6 sm:py-6"
        compactLayout="split"
        title={t('public.landing.emptyEyebrow')}
        variant="compact"
      >
        {t('public.landing.emptyDescription')}
      </EmptyState>
    );
  }

  return (
    <div className="mt-12 grid gap-5 md:grid-cols-2 wide:grid-cols-3">
      {facilities.map((parking) => (
        <ParkingDiscoveryCard key={parking.id} parking={parking} to={`/parkings/${parking.id}`} />
      ))}
    </div>
  );
}
