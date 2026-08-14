import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { registerAuthDocs } from '../features/auth/auth.docs.js';
import { registerBookingDocs } from '../features/booking/booking.docs.js';
import { registerParkingDocs } from '../features/parking/parking.docs.js';
import { registerUserDocs } from '../features/user/user.docs.js';
import { registerVehicleDocs } from '../features/vehicle/vehicle.docs.js';

export function registerFeatureDocs(registry: OpenAPIRegistry): void {
  registerAuthDocs(registry);
  registerBookingDocs(registry);
  registerParkingDocs(registry);
  registerUserDocs(registry);
  registerVehicleDocs(registry);
}
