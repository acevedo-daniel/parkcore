import { describe, expect, it } from 'vitest';

import { ApiError, localizeApiError } from './api-error.js';
import { createTranslator } from '../localization.js';

describe('localizeApiError', () => {
  it('maps status and operation errors to Spanish catalog messages', () => {
    const t = createTranslator('es-AR');

    expect(localizeApiError(new ApiError('backend detail', 401), t, 'api.startSession')).toBe(
      'Tu sesión ya no es válida. Ingresá de nuevo.',
    );
    expect(localizeApiError(new ApiError('backend detail', 400), t, 'api.startSession')).toBe(
      'No pudimos iniciar esta estadía. Revisá la cochera y probá de nuevo.',
    );
    expect(localizeApiError(new Error('backend detail'), t, 'api.startSession')).toBe(
      'No pudimos conectar con ParkCore. Revisá tu conexión y probá de nuevo.',
    );
  });
});
