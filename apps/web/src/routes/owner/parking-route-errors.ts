import { ApiError, getApiErrorDetails, localizeApiError } from '../../lib/api/api-error.js';
import type { Translator } from '../../lib/localization.js';

export function localizeParkingMutationError(
  error: unknown,
  translate: Translator,
  fallback: 'api.createParking' | 'api.updateParking',
) {
  if (error instanceof ApiError && error.code === 'CAPACITY_BELOW_ACTIVE') {
    const activeSessionCount = getApiErrorDetails(error)?.activeSessionCount;
    if (activeSessionCount !== undefined) {
      return translate('api.capacityBelowActive', { count: activeSessionCount });
    }
  }
  return localizeApiError(error, translate, fallback);
}
