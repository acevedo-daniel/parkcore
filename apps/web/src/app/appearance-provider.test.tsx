import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppearanceProvider, useAppearance } from './appearance-provider.js';
import { AppearanceControls } from '../components/ui/appearance-controls.js';

function AppearanceProbe() {
  const { preference, theme } = useAppearance();
  return <output data-testid="appearance">{`${preference}:${theme}`}</output>;
}

function renderAppearance() {
  return render(
    <AppearanceProvider>
      <AppearanceProbe />
      <AppearanceControls />
    </AppearanceProvider>,
  );
}

describe('AppearanceProvider', () => {
  let originalMatchMedia: typeof window.matchMedia | undefined;
  let setSystemTheme: (matches: boolean) => void;

  beforeEach(() => {
    const browser = window as Omit<Window, 'matchMedia'> & {
      matchMedia?: typeof window.matchMedia;
    };
    originalMatchMedia = browser.matchMedia?.bind(window);
    let matches = false;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const matchMedia = (query: string) =>
      ({
        addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        addListener: (listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        dispatchEvent: () => true,
        matches,
        media: query,
        onchange: null,
        removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
        removeListener: (listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
      }) as MediaQueryList;

    setSystemTheme = (nextMatches: boolean) => {
      matches = nextMatches;
      const event = { matches, media: '(prefers-color-scheme: dark)' } as MediaQueryListEvent;
      listeners.forEach((listener) => {
        listener(event);
      });
    };
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: matchMedia,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
      writable: true,
    });
  });

  it('resolves system preference from the operating system and follows changes', async () => {
    setSystemTheme(true);
    renderAppearance();

    expect(screen.getByTestId('appearance').textContent).toBe('system:dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(window.localStorage.getItem('parkcore-theme')).toBeNull();

    setSystemTheme(false);

    await waitFor(() => {
      expect(screen.getByTestId('appearance').textContent).toBe('system:light');
      expect(document.documentElement.dataset.theme).toBe('light');
    });
  });

  it('persists an explicit choice and ignores later system changes', async () => {
    const user = userEvent.setup();
    renderAppearance();
    const control = screen.getByRole('combobox', { name: 'Apariencia' });

    await user.selectOptions(control, 'dark');

    expect(screen.getByTestId('appearance').textContent).toBe('dark:dark');
    expect(window.localStorage.getItem('parkcore-theme')).toBe('dark');

    setSystemTheme(false);

    expect(screen.getByTestId('appearance').textContent).toBe('dark:dark');
  });

  it('restores an explicit choice and returns to system mode without persisting its result', async () => {
    window.localStorage.setItem('parkcore-theme', 'light');
    const user = userEvent.setup();
    renderAppearance();
    const control = screen.getByRole('combobox', { name: 'Apariencia' });

    expect(screen.getByTestId('appearance').textContent).toBe('light:light');
    await user.selectOptions(control, 'system');

    expect(window.localStorage.getItem('parkcore-theme')).toBe('system');
    expect(screen.getByTestId('appearance').textContent).toBe('system:light');
  });
});
