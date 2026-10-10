import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { AppearanceControls } from './appearance-controls.js';

function renderControls({
  presentation = 'compact',
}: { presentation?: 'compact' | 'profile' } = {}) {
  window.localStorage.setItem('parkcore-lang', 'es-AR');
  return render(
    <AppearanceProvider>
      <AppearanceControls presentation={presentation} />
    </AppearanceProvider>,
  );
}

describe('AppearanceControls', () => {
  it('shows profile labels and keeps each language choice keyboard accessible', async () => {
    const user = userEvent.setup();
    renderControls({ presentation: 'profile' });

    expect(
      document
        .querySelector('[data-slot="appearance-controls"]')
        ?.getAttribute('data-presentation'),
    ).toBe('profile');
    expect(screen.getByText('Idioma', { exact: true })).toBeTruthy();
    expect(screen.getByText('Apariencia', { exact: true })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Idioma' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Español' }).getAttribute('aria-checked')).toBe(
      'true',
    );

    await user.click(screen.getByRole('radio', { name: 'Inglés' }));
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en-US');
    });
  });

  it('changes theme by selecting a Radix option in the compact presentation', async () => {
    const user = userEvent.setup();
    renderControls();

    expect(
      document
        .querySelector('[data-slot="appearance-controls"]')
        ?.getAttribute('data-presentation'),
    ).toBe('compact');
    expect(screen.getByRole('radiogroup', { name: 'Seleccionar idioma' })).toBeTruthy();
    const theme = screen.getByRole('combobox', { name: 'Apariencia' });
    await user.click(theme);
    await user.click(await screen.findByRole('option', { name: 'Oscuro' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('parkcore-theme')).toBe('dark');
  });
});
