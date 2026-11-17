import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { sendOk } from '../common/response.js';
import { publicLeadHeaders } from '../leads/leads.schema.js';
import { createAssessmentsService } from './assessments.service.js';
import { assessmentSlugParam, evaluateAssessmentBody, submitAssessmentBody } from './assessments.schema.js';

const assessmentsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = createAssessmentsService(app.deps);
  const publicRate = { rateLimit: { max: app.deps.config.PUBLIC_RATE_LIMIT_MAX, timeWindow: '1 minute' } };

  typed.get(
    '/public/assessments',
    { schema: { tags: ['Public'], summary: 'List active assessments' } },
    async (request, reply) => sendOk(request, reply, await service.list()),
  );

  typed.get(
    '/public/assessments/:slug',
    { schema: { tags: ['Public'], summary: 'Get an assessment with its questions', params: assessmentSlugParam } },
    async (request, reply) => sendOk(request, reply, await service.get(request.params.slug)),
  );

  typed.post(
    '/public/assessments/:slug/evaluate',
    {
      schema: {
        tags: ['Public'],
        summary: 'Score an assessment anonymously (no contact details required)',
        params: assessmentSlugParam,
        body: evaluateAssessmentBody,
      },
      config: publicRate,
    },
    async (request, reply) => sendOk(request, reply, await service.evaluate(request.params.slug, request.body.answers)),
  );

  typed.post(
    '/public/assessments/:slug/submissions',
    {
      schema: {
        tags: ['Public'],
        summary: 'Submit an assessment with contact details to create or update a lead',
        params: assessmentSlugParam,
        body: submitAssessmentBody,
        headers: publicLeadHeaders,
      },
      config: publicRate,
    },
    async (request, reply) => {
      const key = request.headers['idempotency-key'];
      const result = await service.submit(request.params.slug, request.body, typeof key === 'string' ? key : undefined);
      if (result.replayed) reply.header('idempotent-replayed', 'true');
      return sendOk(request, reply, result.body, result.statusCode);
    },
  );
};

export default assessmentsController;
