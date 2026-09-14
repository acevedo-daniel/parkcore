import type { MessageKey, Translator } from '../localization.js';

export interface ApiErrorDetails {
  nextOpeningAt?: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiErrorStatusMessages = Partial<Record<number, MessageKey>>;

export function localizeApiError(
  error: unknown,
  translate: Translator,
  fallback: MessageKey,
  statusMessages: ApiErrorStatusMessages = {},
) {
  if (!(error instanceof ApiError)) return translate('api.network');
  if (error.code === 'DEMO_EXPIRED') return translate('api.demoExpired');

  const statusMessage = statusMessages[error.status];
  if (statusMessage) return translate(statusMessage);
  if (error.status === 401) return translate('api.unauthorized');
  if (error.status === 403) return translate('api.forbidden');
  if (error.status === 404) return translate('api.notFound');
  if (error.status === 409) return translate('api.conflict');
  if (error.status === 429) return translate('api.rateLimited');
  if (error.status >= 500) return translate('api.server');
  return translate(fallback);
}

export function getApiErrorCode(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }
  return undefined;
}

export function getApiErrorDetails(error: unknown): ApiErrorDetails | undefined {
  if (typeof error !== 'object' || error === null || !('details' in error)) {
    return undefined;
  }

  const details = error.details;
  if (typeof details !== 'object' || details === null || !('nextOpeningAt' in details)) {
    return undefined;
  }

  const nextOpeningAt = details.nextOpeningAt;
  if (nextOpeningAt !== null && typeof nextOpeningAt !== 'string') return undefined;
  return { nextOpeningAt };
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return fallback;
}
