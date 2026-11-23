import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify, { type FastifyBaseLogger, type FastifyInstance } from "fastify";
import {
    serializerCompiler,
    validatorCompiler,
} from "fastify-type-provider-zod";
import type { Container } from "./container.js";
import { sanitizeInboundId, newId } from "./logger/correlation.js";
import authorizationPlugin from "./plugins/authorization.plugin.js";
import authPlugin from "./plugins/auth.plugin.js";
import errorHandlerPlugin from "./plugins/error-handler.plugin.js";
import loggerPlugin from "./plugins/logger.plugin.js";
import rateLimitPlugin from "./plugins/rate-limit.plugin.js";
import requestContextPlugin from "./plugins/request-context.plugin.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";
import healthRoutes from "./modules/health/health.routes.js";
import analyticsController from "./modules/analytics/analytics.controller.js";
import geoController from "./modules/geo/geo.controller.js";
import optionsController from "./modules/options/options.controller.js";
import assessmentsController from "./modules/assessments/assessments.controller.js";
import authController from "./modules/auth/auth.controller.js";
import bookingController from "./modules/integrations/booking.controller.js";
import campaignsController from "./modules/campaigns/campaigns.controller.js";
import customersController from "./modules/customers/customers.controller.js";
import followUpsController from "./modules/follow-ups/follow-ups.controller.js";
import leadsController from "./modules/leads/leads.controller.js";
import publicLeadsController from "./modules/leads/public-leads.controller.js";
import aiLeadsController from "./modules/ai/conversations.controller.js";
import captureChatController from "./modules/ai/capture-chat.controller.js";
import smartAssignmentController from "./modules/ai/smart-assignment.controller.js";
import phase3Controller from "./modules/ai/phase3.controller.js";
import llmConfigController from "./modules/ai/llm-config.controller.js";
import appSettingsController from "./modules/settings/app-settings.controller.js";
import rbacController from "./modules/rbac/rbac.controller.js";
import securityEventsController from "./modules/security/security-events.controller.js";
import auditLogsController from "./modules/audit/audit-logs.controller.js";
import sseController from "./modules/events/sse.controller.js";
import opportunitiesController from "./modules/opportunities/opportunities.controller.js";
import revenueController from "./modules/revenue/revenue.controller.js";
import usersController from "./modules/users/users.controller.js";

export const API_PREFIX = "/api/v1";

/**
 * Builds the Fastify instance. Plugins are registered in dependency order: request context first so
 * every later log line carries correlation, then errors, security headers, CORS, rate limits, auth.
 */
export async function buildApp(container: Container): Promise<FastifyInstance> {
    const { config } = container;

    const app = Fastify({
        // The application logger is a Pino instance, which satisfies FastifyBaseLogger at runtime.
        loggerInstance: container.logger as unknown as FastifyBaseLogger,
        // Deprecated in Fastify 5 in favour of logController; kept until the Fastify 6 upgrade.
        disableRequestLogging: true,
        requestIdHeader: false,
        genReqId: (req) =>
            sanitizeInboundId(req.headers["x-request-id"]) ?? newId("req"),
        trustProxy: config.TRUST_PROXY,
        bodyLimit: config.BODY_LIMIT_BYTES,
        ajv: { customOptions: { removeAdditional: false, coerceTypes: true } },
    });

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    app.decorate("deps", container);

    await app.register(requestContextPlugin);
    await app.register(loggerPlugin);
    await app.register(errorHandlerPlugin);
    await app.register(helmet, { global: true });
    await app.register(cors, {
        origin: config.corsOrigins,
        credentials: false,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: [],
        maxAge: 86400,
    });
    await app.register(rateLimitPlugin);
    await app.register(authPlugin);
    await app.register(authorizationPlugin);
    await app.register(swaggerPlugin);

    await app.register(healthRoutes);

    await app.register(
        async (api) => {
            await api.register(authController);
            await api.register(usersController);
            await api.register(captureChatController);
            await api.register(publicLeadsController);
            await api.register(geoController);
            await api.register(optionsController);
            await api.register(leadsController);
            await api.register(aiLeadsController);
            await api.register(smartAssignmentController);
            await api.register(phase3Controller);
            await api.register(assessmentsController);
            await api.register(opportunitiesController);
            await api.register(followUpsController);
            await api.register(customersController);
            await api.register(campaignsController);
            await api.register(revenueController);
            await api.register(analyticsController);
            await api.register(bookingController);
            await api.register(llmConfigController);
            await api.register(appSettingsController);
            await api.register(rbacController);
            await api.register(securityEventsController);
            await api.register(auditLogsController);
            await api.register(sseController);
        },
        { prefix: API_PREFIX },
    );

    return app;
}
