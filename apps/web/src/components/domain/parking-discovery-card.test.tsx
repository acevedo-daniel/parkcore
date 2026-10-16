import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { AvailabilityIndicator } from './availability-indicator.js';
import { ParkingDiscoveryCard } from './parking-discovery-card.js';
import { publicParkingFixture } from '../../test/fixtures.js';

function renderPublicContent(locale: 'en-US' | 'es-AR', theme: 'light' | 'dark') {
  window.localStorage.setItem('parkcore-lang', locale);
  window.localStorage.setItem('parkcore-theme', theme);
  return render(
    <AppearanceProvider>
      <MemoryRouter>
        <ParkingDiscoveryCard
          parking={publicParkingFixture({ isShowcase: true })}
          to="/parkings/parking-1"
        />
        <AvailabilityIndicator state="FULL" />
      </MemoryRouter>
    </AppearanceProvider>,
  );
}

describe('public parking presentation', () => {
  it('keeps shared card and status semantics visible in the dark theme', () => {
    renderPublicContent('en-US', 'dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
    const link = screen.getByRole('link', { name: 'Open Central Parking' });
    expect(link.className).toContain('bg-card');
    expect(link.getAttribute('aria-describedby')).toBe('parking-parking-1-availability');
    expect(document.getElementById('parking-parking-1-availability')?.textContent).toBe(
      'Available',
    );
    expect(screen.getByRole('img', { name: 'Parking image not available' })).toBeTruthy();
    const card = screen.getByRole('link', { name: 'Open Central Parking' });
    const media = card.querySelector<HTMLElement>('[data-slot="discovery-card-media"]');
    const demoBadge = within(card).getByText('Demo');
    expect(media).not.toBeNull();
    expect(media?.contains(demoBadge)).toBe(true);
    expect(demoBadge.getAttribute('data-variant')).toBe('brand');
    const title = within(card).getByRole('heading', { name: 'Central Parking' });
    expect(title.nextElementSibling?.textContent).toBe('Downtown');
    expect(screen.getByText('Full')).toBeTruthy();
  });

  it('localizes shared card and availability copy in Spanish', () => {
    renderPublicContent('es-AR', 'light');

    expect(screen.getByRole('link', { name: 'Abrir Central Parking' })).toBeTruthy();
    const card = screen.getByRole('link', { name: 'Abrir Central Parking' });
    const media = card.querySelector<HTMLElement>('[data-slot="discovery-card-media"]');
    const demoBadge = within(card).getByText('Demo');
    expect(media?.contains(demoBadge)).toBe(true);
    expect(within(card).getByRole('heading').nextElementSibling?.textContent).toBe('Downtown');
    expect(screen.getByText('Completa')).toBeTruthy();
    expect(screen.getByText('Tarifa por hora')).toBeTruthy();
  });
});
