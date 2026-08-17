import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

export function registerGlobalComponents(registry: OpenAPIRegistry): void {
  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token obtained from /auth/login',
  });
}
