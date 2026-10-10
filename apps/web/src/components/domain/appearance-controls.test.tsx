import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { AppearanceControls } from './appearance-controls.js';

function renderControls({
  layout = 'inline',
  presentation = 'compact',
}: { layout?: 'inline' | 'stacked'; presentation?: 'compact' | 'profile' } = {}) {
  window.localStorage.setItem('parkcore-lang', 'es-AR');
  return render(
    <AppearanceProvider>
      <AppearanceControls layout={layout} presentation={presentation} />
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
    expect(screen.getByRole('radiogroup', { name: 'Apariencia' })).toBeTruthy();
    expect(screen.getByText('Sistema', { exact: true })).toBeTruthy();
    expect(screen.getByText('Claro', { exact: true })).toBeTruthy();
    expect(screen.getByText('Oscuro', { exact: true })).toBeTruthy();

    await user.click(screen.getByRole('radio', { name: 'Inglés' }));
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en-US');
    });
  });

  it('renders compact theme segments and supports pointer and arrow-key selection', async () => {
    const user = userEvent.setup();
    renderControls();

    expect(
      document
        .querySelector('[data-slot="appearance-controls"]')
        ?.getAttribute('data-presentation'),
    ).toBe('compact');
    expect(screen.getByRole('radiogroup', { name: 'Seleccionar idioma' })).toBeTruthy();
    const theme = screen.getByRole('radiogroup', { name: 'Apariencia' });
    const system = within(theme).getByRole('radio', { name: 'Sistema' });
    const light = within(theme).getByRole('radio', { name: 'Claro' });
    const dark = within(theme).getByRole('radio', { name: 'Oscuro' });

    expect(system.getAttribute('aria-checked')).toBe('true');
    expect(light.getAttribute('aria-checked')).toBe('false');
    expect(dark.getAttribute('aria-checked')).toBe('false');
    expect(within(theme).getAllByRole('radio')).toHaveLength(3);

    await user.click(system);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(light);

    await user.click(dark);

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('parkcore-theme')).toBe('dark');
    expect(dark.getAttribute('aria-checked')).toBe('true');
  });

  it('exposes the stacked layout for the owner sidebar', () => {
    renderControls({ layout: 'stacked' });

    const controls = document.querySelector<HTMLElement>('[data-slot="appearance-controls"]');
    expect(controls?.getAttribute('data-layout')).toBe('stacked');
    expect(controls?.className).toContain('flex-col');
    expect(controls?.className).toContain('items-start');
  });
});
