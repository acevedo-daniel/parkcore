import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { AppearanceControls } from './appearance-controls.js';

function renderControls({
  locale = 'es-AR',
  presentation = 'compact',
}: {
  locale?: 'es-AR' | 'en-US';
  presentation?: 'compact' | 'profile';
} = {}) {
  window.localStorage.setItem('parkcore-lang', locale);

  return render(
    <AppearanceProvider>
      <AppearanceControls presentation={presentation} />
    </AppearanceProvider>,
  );
}

describe('AppearanceControls', () => {
  it('shows separate profile labels while keeping shell controls compact', () => {
    renderControls({ presentation: 'profile' });

    expect(
      document
        .querySelector('[data-slot="appearance-controls"]')
        ?.getAttribute('data-presentation'),
    ).toBe('profile');
    expect(screen.getByText('Idioma', { exact: true })).toBeTruthy();
    expect(screen.getByText('Apariencia', { exact: true })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Idioma' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Apariencia' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Español' }).className).toContain(
      'min-w-[var(--touch-target-min)]',
    );
    expect(screen.getByRole('button', { name: 'Inglés' }).className).toContain(
      'min-h-[var(--touch-target-min)]',
    );
  });

  it('keeps shell presentation concise and supports keyboard locale and theme changes', async () => {
    const user = userEvent.setup();
    renderControls();

    expect(
      document
        .querySelector('[data-slot="appearance-controls"]')
        ?.getAttribute('data-presentation'),
    ).toBe('compact');
    expect(screen.queryByText('Idioma', { exact: true })).toBeNull();

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Español' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Inglés' }));
    await user.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en-US');
    });

    await user.tab();
    const theme = screen.getByRole('combobox', { name: 'Theme' });
    expect(document.activeElement).toBe(theme);
    await user.selectOptions(theme, 'dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('parkcore-theme')).toBe('dark');
  });
});
