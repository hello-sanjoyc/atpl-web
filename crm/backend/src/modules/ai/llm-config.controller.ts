import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { idParam } from '../common/schemas.js';
import { sendOk, sendList, pagination } from '../common/response.js';
import { createLlmConfigService } from './llm-config.service.js';

const security = [{ bearerAuth: [] }];

const PROVIDERS = ['anthropic', 'openai', 'gemini', 'perplexity', 'generic'] as const;

const createBody = z.object({
  label: z.string().min(1).max(120),
  provider: z.enum(PROVIDERS),
  model: z.string().min(1).max(200),
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
  maxTokens: z.coerce.number().int().min(100).max(32768).default(2048),
  timeoutMs: z.coerce.number().int().min(5_000).max(600_000).default(30_000),
  activate: z.boolean().default(false),
});

const updateBody = z.object({
  label: z.string().min(1).max(120).optional(),
  model: z.string().min(1).max(200).optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional().or(z.literal('')),
  maxTokens: z.coerce.number().int().min(100).max(32768).optional(),
  timeoutMs: z.coerce.number().int().min(5_000).max(600_000).optional(),
});

/** All LLM config endpoints are restricted to super_admin. */
function isSuperAdmin(role: string): boolean {
  return role === 'super_admin';
}

const llmConfigController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  const guard = async (request: { user: { role: string } }, reply: { code: (n: number) => { send: (b: unknown) => void } }) => {
    if (!isSuperAdmin(request.user.role)) {
      reply.code(403).send({ error: 'Forbidden', message: 'Only super_admin can manage LLM configuration.' });
    }
  };

  typed.get(
    '/settings/llm',
    { schema: { tags: ['Settings', 'AI'], summary: 'List all LLM provider configurations', security }, preHandler: [app.authenticate, guard as never] },
    async (request, reply) => {
      const svc = createLlmConfigService(app.deps);
      const items = await svc.list();
      return sendList(request, reply, items, pagination(1, items.length, items.length));
    },
  );

  typed.post(
    '/settings/llm',
    { schema: { tags: ['Settings', 'AI'], summary: 'Create an LLM provider configuration', body: createBody, security }, preHandler: [app.authenticate, guard as never] },
    async (request, reply) => {
      const svc = createLlmConfigService(app.deps);
      const row = await svc.create(request.user, request.body);
      return sendOk(request, reply, row, 201);
    },
  );

  typed.patch(
    '/settings/llm/:id',
    { schema: { tags: ['Settings', 'AI'], summary: 'Update an LLM provider configuration', params: idParam, body: updateBody, security }, preHandler: [app.authenticate, guard as never] },
    async (request, reply) => {
      const svc = createLlmConfigService(app.deps);
      const row = await svc.update(request.user, request.params.id, request.body);
      return sendOk(request, reply, row);
    },
  );

  typed.post(
    '/settings/llm/:id/activate',
    { schema: { tags: ['Settings', 'AI'], summary: 'Activate this LLM configuration (deactivates all others)', params: idParam, security }, preHandler: [app.authenticate, guard as never] },
    async (request, reply) => {
      const svc = createLlmConfigService(app.deps);
      const row = await svc.activate(request.user, request.params.id);
      return sendOk(request, reply, row);
    },
  );

  typed.post(
    '/settings/llm/:id/test',
    { schema: { tags: ['Settings', 'AI'], summary: 'Test connectivity for an LLM configuration', params: idParam, security }, preHandler: [app.authenticate, guard as never] },
    async (request, reply) => {
      const svc = createLlmConfigService(app.deps);
      const result = await svc.testConnection(request.params.id);
      return sendOk(request, reply, result);
    },
  );

  typed.delete(
    '/settings/llm/:id',
    { schema: { tags: ['Settings', 'AI'], summary: 'Delete an LLM provider configuration', params: idParam, security }, preHandler: [app.authenticate, guard as never] },
    async (request, reply) => {
      const svc = createLlmConfigService(app.deps);
      await svc.delete(request.user, request.params.id);
      return sendOk(request, reply, { deleted: true });
    },
  );
};

export default llmConfigController;
