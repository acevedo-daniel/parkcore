import { OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import '../lib/openapi-registry.js';
import { registerFeatureDocs } from '../docs/register-feature-docs.js';
import { registerGlobalComponents } from '../docs/register-global-components.js';
import { registerSystemDocs } from '../docs/register-system-docs.js';

function createRegistry(): OpenAPIRegistry {
  const registry = new OpenAPIRegistry();
  registerGlobalComponents(registry);
  registerSystemDocs(registry);
  registerFeatureDocs(registry);
  return registry;
}

export function generateOpenApiDocument() {
  const registry = createRegistry();
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'ParkCore API',
      version: '1.0.0',
      description:
        'Backend API for parking facility management. API-first solution with strict typing and validation.',
      contact: {
        name: 'Daniel Acevedo',
        url: 'https://github.com/acevedo-daniel',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development',
      },
      {
        url: 'https://parkcore-api.onrender.com',
        description: 'Production',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Parkings', description: 'Parking lot management' },
      { name: 'Bookings', description: 'Check-in/Check-out flow' },
      { name: 'Vehicles', description: 'Vehicle registry' },
      { name: 'User', description: 'User profile management' },
      { name: 'System', description: 'Operational endpoints' },
    ],
  });
}
