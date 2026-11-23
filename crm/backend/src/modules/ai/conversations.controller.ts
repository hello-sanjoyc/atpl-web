import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { idParam } from '../common/schemas.js';
import { sendList, sendOk } from '../common/response.js';
import { createConversationsService } from './conversations.service.js';
import { createFollowUpDraftService } from './follow-up-draft.service.js';

const security = [{ bearerAuth: [] }];

const submitConversationBody = z.object({
  rawText: z.string().min(10, 'Conversation text must be at least 10 characters'),
  kind: z.enum(['transcript', 'meeting_notes', 'email_thread']).default('transcript'),
});

const followUpDraftBody = z.object({
  channel: z.enum(['email', 'whatsapp']).default('email'),
});

const aiLeadsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const conversationsService = createConversationsService(app.deps);
  const followUpService = createFollowUpDraftService(app.deps);

  typed.post(
    '/leads/:id/conversations',
    {
      schema: {
        tags: ['Leads', 'AI'],
        summary: 'Submit a call transcript, meeting notes or email thread for AI extraction',
        params: idParam,
        body: submitConversationBody,
        security,
      },
      preHandler: app.authorize('leads.update'),
    },
    async (request, reply) => {
      const result = await conversationsService.submit(request.user, request.params.id, request.body);
      return sendOk(request, reply, result, 201);
    },
  );

  typed.get(
    '/leads/:id/conversations',
    {
      schema: {
        tags: ['Leads', 'AI'],
        summary: 'List conversation extractions for a lead',
        params: idParam,
        security,
      },
      preHandler: app.authorize('leads.read'),
    },
    async (request, reply) => {
      const { items, page } = await conversationsService.list(request.user, request.params.id);
      return sendList(request, reply, items, page);
    },
  );

  typed.post(
    '/leads/:id/follow-up-draft',
    {
      schema: {
        tags: ['Leads', 'AI'],
        summary: 'Generate a personalized follow-up draft for a lead',
        params: idParam,
        body: followUpDraftBody,
        security,
      },
      preHandler: app.authorize('leads.update'),
    },
    async (request, reply) => {
      const result = await followUpService.generate(request.user, request.params.id, request.body.channel);
      return sendOk(request, reply, result);
    },
  );
};

export default aiLeadsController;
