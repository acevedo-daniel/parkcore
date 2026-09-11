import { render, screen } from '@testing-library/react';
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
    expect(screen.getByRole('link', { name: 'Open Central Parking' }).className).toContain(
      'bg-surface',
    );
    expect(screen.getByRole('img', { name: 'Parking image not available' })).toBeTruthy();
    expect(screen.getByText('Demo')).toBeTruthy();
    expect(screen.getByText('Full')).toBeTruthy();
  });

  it('localizes shared card and availability copy in Spanish', () => {
    renderPublicContent('es-AR', 'light');

    expect(screen.getByRole('link', { name: 'Abrir Central Parking' })).toBeTruthy();
    expect(screen.getByText('Demo')).toBeTruthy();
    expect(screen.getByText('Completa')).toBeTruthy();
    expect(screen.getByText('Tarifa por hora')).toBeTruthy();
  });
});
