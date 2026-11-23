import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { sendOk } from '../common/response.js';
import { DEFAULT_FORECAST_REFRESH_COOLDOWN_MS, getForecastCooldownMs, setForecastCooldownMs } from '../ai/revenue-forecast.service.js';

const security = [{ bearerAuth: [] }];

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const updateForecastSettingsBody = z.object({
  refreshCooldownMs: z.coerce.number().int().min(FIVE_MINUTES_MS).max(SEVEN_DAYS_MS),
});

/** All app-settings endpoints are restricted to super_admin — the same gate as LLM provider config. */
function isSuperAdmin(role: string): boolean {
  return role === 'super_admin';
}

const appSettingsController: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  const guard = async (request: { user: { role: string } }, reply: { code: (n: number) => { send: (b: unknown) => void } }) => {
    if (!isSuperAdmin(request.user.role)) {
      reply.code(403).send({ error: 'Forbidden', message: 'Only super_admin can manage app settings.' });
    }
  };

  typed.get(
    '/settings/forecast',
    {
      schema: { tags: ['Settings', 'AI'], summary: 'Get AI revenue forecast settings (refresh cooldown)', security },
      preHandler: [app.authenticate, guard as never],
    },
    async (request, reply) => {
      const refreshCooldownMs = await getForecastCooldownMs(app.deps);
      return sendOk(request, reply, { refreshCooldownMs, defaultRefreshCooldownMs: DEFAULT_FORECAST_REFRESH_COOLDOWN_MS });
    },
  );

  typed.patch(
    '/settings/forecast',
    {
      schema: {
        tags: ['Settings', 'AI'],
        summary: 'Set the minimum time between AI-backed forecast regenerations (5 minutes to 7 days)',
        body: updateForecastSettingsBody,
        security,
      },
      preHandler: [app.authenticate, guard as never],
    },
    async (request, reply) => {
      const refreshCooldownMs = await setForecastCooldownMs(app.deps, request.body.refreshCooldownMs, request.user.id);
      return sendOk(request, reply, { refreshCooldownMs, defaultRefreshCooldownMs: DEFAULT_FORECAST_REFRESH_COOLDOWN_MS });
    },
  );
};

export default appSettingsController;
