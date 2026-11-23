import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { idParam } from '../common/schemas.js';
import { sendOk } from '../common/response.js';
import { analyzeOpportunityHealth } from './opportunity-intelligence.service.js';
import { generateProposal, listProposals } from './proposal-assistant.service.js';
import { generateForecast, getLatestForecast } from './revenue-forecast.service.js';
import { createSalesCopilotService } from './sales-copilot.service.js';

const security = [{ bearerAuth: [] }];

const copilotBody = z.object({
  question: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000),
  })).max(20).default([]),
});

const forecastQuery = z.object({
  currency: z.string().length(3).default('USD'),
  refresh: z.coerce.boolean().default(false),
});

const phase3Controller: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // ── Opportunity Intelligence ───────────────────────────────────────────────

  typed.get(
    '/opportunities/:id/health',
    {
      schema: {
        tags: ['Opportunities', 'AI'],
        summary: 'AI health analysis for an opportunity — stall detection, risks, next steps',
        params: idParam,
        security,
      },
      preHandler: app.authorize('opportunities.read'),
    },
    async (request, reply) => {
      const result = await analyzeOpportunityHealth(app.deps, request.params.id);
      return sendOk(request, reply, result);
    },
  );

  // ── AI Proposal Assistant ──────────────────────────────────────────────────

  typed.post(
    '/opportunities/:id/proposals/generate',
    {
      schema: {
        tags: ['Opportunities', 'AI'],
        summary: 'Generate a new AI proposal version from opportunity + conversation history',
        params: idParam,
        security,
      },
      preHandler: app.authorize('opportunities.update'),
    },
    async (request, reply) => {
      const result = await generateProposal(app.deps, request.params.id, request.user.id);
      return sendOk(request, reply, result, 201);
    },
  );

  typed.get(
    '/opportunities/:id/proposals',
    {
      schema: {
        tags: ['Opportunities', 'AI'],
        summary: 'List all AI proposal versions for an opportunity',
        params: idParam,
        security,
      },
      preHandler: app.authorize('opportunities.read'),
    },
    async (request, reply) => {
      const rows = await listProposals(app.deps, request.params.id);
      return sendOk(request, reply, rows);
    },
  );

  // ── AI Revenue Forecasting ─────────────────────────────────────────────────

  typed.get(
    '/forecasts/revenue',
    {
      schema: {
        tags: ['Analytics', 'AI'],
        summary:
          'Get AI revenue forecast. Pass refresh=true to regenerate — rate-limited per the configurable ' +
          'forecast refresh cooldown (Settings → General); a refresh within the cooldown just returns ' +
          'the existing snapshot without calling the LLM.',
        querystring: forecastQuery,
        security,
      },
      preHandler: app.authorize('analytics.read'),
    },
    async (request, reply) => {
      const { currency, refresh } = request.query;
      const latest = await getLatestForecast(app.deps);
      if (!refresh) {
        const result = latest ?? (await generateForecast(app.deps, currency));
        return sendOk(request, reply, result);
      }
      const onCooldown = latest !== null && new Date(latest.nextRefreshAt).getTime() > Date.now();
      const result = onCooldown ? latest : await generateForecast(app.deps, currency);
      return sendOk(request, reply, result);
    },
  );

  // ── AI Sales Copilot ───────────────────────────────────────────────────────

  typed.post(
    '/copilot/query',
    {
      schema: {
        tags: ['AI'],
        summary: 'Natural language query against CRM data — AI Sales Copilot',
        body: copilotBody,
        security,
      },
      preHandler: app.authorize('analytics.read'),
    },
    async (request, reply) => {
      const copilot = createSalesCopilotService(app.deps);
      const result = await copilot.query(request.user, request.body.question, request.body.history);
      return sendOk(request, reply, result);
    },
  );
};

export default phase3Controller;
