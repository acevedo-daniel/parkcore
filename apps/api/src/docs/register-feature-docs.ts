import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { registerAuthDocs } from '../features/auth/auth.docs.js';
import { registerParkingSessionDocs } from '../features/parking-session/parking-session.docs.js';
import { registerParkingDocs } from '../features/parking/parking.docs.js';
import { registerUserDocs } from '../features/user/user.docs.js';
import { registerAnalyticsDocs } from '../features/analytics/analytics.docs.js';

export function registerFeatureDocs(registry: OpenAPIRegistry): void {
  registerAuthDocs(registry);
  registerParkingSessionDocs(registry);
  registerParkingDocs(registry);
  registerUserDocs(registry);
  registerAnalyticsDocs(registry);
}
