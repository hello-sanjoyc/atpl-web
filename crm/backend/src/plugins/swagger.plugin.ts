import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

/** OpenAPI 3.1 document generated from the Zod route schemas. Served at /docs when enabled. */
export default fp(
  async (app: FastifyInstance) => {
    const { config } = app.deps;
    await app.register(swagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: 'Aranax Lead, CRM and Revenue API',
          description: 'Lead capture, pipeline, customers, revenue and analytics for Aranax Technologies.',
          version: config.appVersion,
        },
        servers: [{ url: '/' }],
        tags: [
          { name: 'Public', description: 'Anonymous endpoints for website forms and assessments' },
          { name: 'Auth' },
          { name: 'Users' },
          { name: 'Leads' },
          { name: 'Opportunities' },
          { name: 'Follow-ups' },
          { name: 'Customers' },
          { name: 'Campaigns' },
          { name: 'Referrals' },
          { name: 'Revenue' },
          { name: 'Analytics' },
          { name: 'Exports' },
          { name: 'Webhooks' },
          { name: 'Ops' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
      transform: jsonSchemaTransform,
    });

    if (config.swaggerEnabled) {
      await app.register(swaggerUi, { routePrefix: '/docs', uiConfig: { docExpansion: 'list' } });
    }
  },
  { name: 'swagger' },
);
