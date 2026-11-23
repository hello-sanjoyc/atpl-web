import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { idParam } from '../common/schemas.js';
import { sendList, sendOk, pagination } from '../common/response.js';
import { createSmartAssignmentService } from './smart-assignment.service.js';

const security = [{ bearerAuth: [] }];

const repSkillsBody = z.object({
  isAvailable: z.boolean().optional(),
  currentLeadLoad: z.coerce.number().int().min(0).max(1000).optional(),
  recentWinRate: z.coerce.number().min(0).max(1).optional(),
  profile: z.object({
    industries: z.array(z.string()).optional(),
    serviceInterests: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
  }).optional(),
});

const smartAssignmentController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /leads/:id/suggest-assignee
   * Returns a ranked list of up to 5 suggested reps for the lead.
   */
  typed.get(
    '/leads/:id/suggest-assignee',
    {
      schema: {
        tags: ['Leads', 'AI'],
        summary: 'Suggest the best rep to assign this lead to',
        params: idParam,
        security,
      },
      preHandler: app.authorize('leads.assign'),
    },
    async (request, reply) => {
      const service = createSmartAssignmentService(app.deps);
      const suggestions = await service.suggestAssignees(request.params.id);
      return sendList(request, reply, suggestions, pagination(1, 5, suggestions.length));
    },
  );

  /**
   * GET /users/:id/rep-skills
   * Returns the skill profile for a specific rep.
   */
  typed.get(
    '/users/:id/rep-skills',
    {
      schema: {
        tags: ['Users', 'AI'],
        summary: 'Get skill profile for a rep',
        params: idParam,
        security,
      },
      preHandler: app.authorize('users.manage'),
    },
    async (request, reply) => {
      const service = createSmartAssignmentService(app.deps);
      const skills = await service.getRepSkills(request.params.id);
      return sendOk(request, reply, skills);
    },
  );

  /**
   * PUT /users/:id/rep-skills
   * Upsert the skill profile for a rep.
   */
  typed.put(
    '/users/:id/rep-skills',
    {
      schema: {
        tags: ['Users', 'AI'],
        summary: 'Update rep skill profile',
        params: idParam,
        body: repSkillsBody,
        security,
      },
      preHandler: app.authorize('users.manage'),
    },
    async (request, reply) => {
      const service = createSmartAssignmentService(app.deps);
      await service.upsertRepSkills(request.params.id, {
        isAvailable: request.body.isAvailable,
        currentLeadLoad: request.body.currentLeadLoad,
        recentWinRate: request.body.recentWinRate,
        profile: request.body.profile as Parameters<typeof service.upsertRepSkills>[1]['profile'],
      });
      return sendOk(request, reply, { updated: true });
    },
  );
};

export default smartAssignmentController;
