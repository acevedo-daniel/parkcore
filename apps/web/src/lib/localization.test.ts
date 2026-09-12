import { describe, expect, it } from 'vitest';

import {
  createPluralTranslator,
  createTranslator,
  resolveLocale,
  translate,
} from './localization.js';

describe('localization foundation', () => {
  it('resolves supported and legacy locale values defensively', () => {
    expect(resolveLocale('en-US')).toBe('en-US');
    expect(resolveLocale('en')).toBe('en-US');
    expect(resolveLocale('invalid')).toBe('es-AR');
    expect(resolveLocale(undefined)).toBe('es-AR');
  });

  it('translates nested keys and interpolates dynamic values', () => {
    expect(translate('es-AR', 'session.openFor', { plate: 'AB123CD' })).toBe(
      'Abrir la sesión de AB123CD',
    );
    expect(createTranslator('en-US')('session.openFor', { plate: 'AB123CD' })).toBe(
      'Open session for AB123CD',
    );
  });

  it('falls back to Spanish and selects the correct plural form', () => {
    expect(createTranslator('invalid')('nav.signIn')).toBe('Ingresar');
    const translatePlural = createPluralTranslator('en-US');
    expect(translatePlural(1, { one: 'session.hour', other: 'session.hours' })).toBe('hour');
    expect(translatePlural(2, { one: 'session.hour', other: 'session.hours' })).toBe('hours');
  });

  it('keeps public shell and status messages available in both locales', () => {
    expect(createTranslator('es-AR')('nav.howItWorks')).toBe('Cómo funciona');
    expect(createTranslator('en-US')('nav.howItWorks')).toBe('How it works');
    expect(
      createTranslator('es-AR')('availability.closedWithOpening', {
        status: 'Cerrada ahora',
        time: '08:00',
      }),
    ).toBe('Cerrada ahora · abre a las 08:00');
    expect(createTranslator('en-US')('public.detail.showcaseDisclosure')).toBe(
      'Fictional parking with demonstration data for exploring ParkCore.',
    );
  });
});
