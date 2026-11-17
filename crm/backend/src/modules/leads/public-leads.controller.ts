import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { sendOk } from '../common/response.js';
import { createLeadCaptureService } from './lead-capture.service.js';
import { discoveryRequestBody, publicLeadBody, publicLeadHeaders } from './leads.schema.js';

const publicLeadsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const capture = createLeadCaptureService(app.deps);
  const publicRate = { rateLimit: { max: app.deps.config.PUBLIC_RATE_LIMIT_MAX, timeWindow: '1 minute' } };

  typed.post(
    '/public/leads',
    {
      schema: {
        tags: ['Public'],
        summary: 'Submit a project enquiry from the website',
        description:
          'Idempotent when an Idempotency-Key header is supplied. Duplicate email addresses are recorded against the existing lead. Returns 202 without a reference when suppressed or duplicate.',
        body: publicLeadBody,
        headers: publicLeadHeaders,
      },
      config: publicRate,
    },
    async (request, reply) => {
      const key = request.headers['idempotency-key'];
      const result = await capture.submitLead(request.body, typeof key === 'string' ? key : undefined);
      if (result.replayed) reply.header('idempotent-replayed', 'true');
      return sendOk(request, reply, result.body, result.statusCode);
    },
  );

  typed.post(
    '/public/discovery-requests',
    {
      schema: {
        tags: ['Public'],
        summary: 'Request a discovery call',
        body: discoveryRequestBody,
        headers: publicLeadHeaders,
      },
      config: publicRate,
    },
    async (request, reply) => {
      const key = request.headers['idempotency-key'];
      const result = await capture.submitDiscovery(request.body, typeof key === 'string' ? key : undefined);
      if (result.replayed) reply.header('idempotent-replayed', 'true');
      return sendOk(request, reply, result.body, result.statusCode);
    },
  );
};

export default publicLeadsController;
