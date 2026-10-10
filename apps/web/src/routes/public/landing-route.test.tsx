import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { components } from '@parkcore/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { AuthProvider } from '../../features/auth/auth-provider.js';
import { publicParkingFixture } from '../../test/fixtures.js';
import { LandingRoute } from './landing-route.js';

const api = vi.hoisted(() => ({ getPublicParkings: vi.fn() }));

vi.mock('../../lib/api/public-api.js', () => ({ getPublicParkings: api.getPublicParkings }));

type ParkingList = components['schemas']['PublicParkingListResponse'];

function listFixture(data: ParkingList['data']): ParkingList {
  return {
    data,
    meta: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 10,
      page: 1,
      total: data.length,
      totalPages: 1,
    },
  };
}

function renderLanding() {
  return render(
    <AppearanceProvider>
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <AuthProvider>
          <MemoryRouter>
            <LandingRoute />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </AppearanceProvider>,
  );
}

afterEach(() => {
  api.getPublicParkings.mockReset();
});

describe('public landing route', () => {
  it('fills the first screen with the landing hero', () => {
    api.getPublicParkings.mockResolvedValue(listFixture([]));
    const { container } = renderLanding();

    const hero = container.querySelector('[data-slot="landing-hero"]');
    expect(hero?.getAttribute('data-slot')).toBe('landing-hero');
    expect(hero?.classList.contains('min-h-svh')).toBe(true);
  });

  it('keeps one brand surface and contains the closing actions', () => {
    api.getPublicParkings.mockResolvedValue(listFixture([]));
    const { container } = renderLanding();

    expect(container.querySelectorAll('section.bg-brand')).toHaveLength(1);
    expect(container.querySelector('section.bg-card, section.bg-muted, section.bg-inverse')).toBe(
      null,
    );

    const closingPanel = container.querySelector('.rounded-signature.bg-inverse');
    expect(closingPanel).not.toBeNull();
    const closingDemoAction = closingPanel?.querySelector(
      'button[data-slot="button"][data-variant="secondary"]',
    );
    expect(closingDemoAction).not.toBeNull();
    expect(closingDemoAction?.classList.contains('rounded-full')).toBe(true);
    expect(closingPanel?.querySelector('a[data-slot="button"][data-size="lg"]')).not.toBeNull();
    expect(
      container.querySelector(
        'section[data-slot="landing-hero"] a[data-slot="button"][data-size="lg"]',
      ),
    ).not.toBeNull();
    expect(container.querySelector('footer.bg-background')).not.toBeNull();
    expect(container.querySelector('footer [class*="text-brand"]')).toBeNull();
  });

  it('uses public API facilities and marks showcase parking', async () => {
    api.getPublicParkings.mockResolvedValue(
      listFixture([publicParkingFixture({ isShowcase: true })]),
    );
    renderLanding();

    expect(await screen.findByRole('link', { name: 'Abrir Central Parking' })).toBeTruthy();
    expect(screen.getByText('Demo', { exact: true })).toBeTruthy();
    expect(api.getPublicParkings).toHaveBeenCalledWith({ limit: 10 });
    expect(api.getPublicParkings).toHaveBeenCalledWith({ limit: 6 });
  });

  it('keeps the estimator controls localized in English', async () => {
    window.localStorage.setItem('parkcore-lang', 'en-US');
    api.getPublicParkings.mockResolvedValue(
      listFixture([publicParkingFixture({ isShowcase: true })]),
    );
    renderLanding();

    expect(await screen.findByRole('radio', { name: 'Custom' })).toBeTruthy();
  });

  it('keeps the landing featured region intentional when the public API has no facilities', async () => {
    api.getPublicParkings.mockResolvedValue(listFixture([]));
    renderLanding();

    expect(await screen.findByText('Todavía no hay cocheras')).toBeTruthy();
    expect(screen.getByText('Sin cocheras disponibles')).toBeTruthy();
  });

  it('exposes FAQ disclosures as keyboard-operable controls', async () => {
    const user = userEvent.setup();
    api.getPublicParkings.mockResolvedValue(listFixture([]));
    renderLanding();

    const question = await screen.findByRole('button', {
      name: '¿Necesito descargar una aplicación para estacionar?',
    });
    const answerId = question.getAttribute('aria-controls');
    expect(answerId).toBeTruthy();
    expect(question.getAttribute('aria-expanded')).toBe('true');

    const answer = document.getElementById(answerId ?? '');
    expect(answer?.hidden).toBe(false);

    await user.click(question);
    expect(question.getAttribute('aria-expanded')).toBe('false');
    expect(answer?.hidden).toBe(true);

    await user.click(question);
    expect(question.getAttribute('aria-expanded')).toBe('true');
    expect(answer?.hidden).toBe(false);
  });
});
