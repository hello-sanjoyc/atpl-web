import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { ErrorCodes } from "../../errors/error-codes.js";
import { AuthenticationError } from "../../errors/app.error.js";
import { findActiveUserById } from "../users/users.repository.js";
import { sendOk } from "../common/response.js";
import { createAuthService } from "./auth.service.js";
import { getPermissionsForRole } from "../rbac/rbac.service.js";
import { PERMISSIONS } from "../../config/constants.js";

const loginBody = z.object({
    email: z.string().trim().max(254),
    password: z.string().min(1).max(128),
});

const authController: FastifyPluginAsync = async (app) => {
    const typed = app.withTypeProvider<ZodTypeProvider>();
    const service = createAuthService(app.deps, app.signAccessToken);

    typed.post(
        "/auth/login",
        {
            schema: {
                tags: ["Auth"],
                summary: "Exchange credentials for an access token",
                body: loginBody,
            },
            config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
        },
        async (request, reply) => {
            const result = await service.login(
                request.body.email,
                request.body.password,
                { ip: request.ip, userAgent: request.headers["user-agent"] },
            );
            return sendOk(request, reply, result);
        },
    );

    typed.get(
        "/auth/me",
        {
            schema: {
                tags: ["Auth"],
                summary: "Return the authenticated user",
                security: [{ bearerAuth: [] }],
            },
            preHandler: async (request) => {
                await app.authenticate(request);
            },
        },
        async (request, reply) => {
            const user = await findActiveUserById(app.deps.db, request.user.id);
            if (!user)
                throw new AuthenticationError(
                    ErrorCodes.UNAUTHENTICATED,
                    "The access token is invalid or has expired.",
                );
            return sendOk(request, reply, user);
        },
    );
    typed.get(
        "/auth/permissions",
        {
            schema: {
                tags: ["Auth"],
                summary: "Return granted permissions for the authenticated user",
                security: [{ bearerAuth: [] }],
            },
            preHandler: async (request) => {
                await app.authenticate(request);
            },
        },
        async (request, reply) => {
            const granted = await getPermissionsForRole(app.deps.db, app.deps.cache, request.user.role);
            return sendOk(request, reply, {
                role: request.user.role,
                permissions: PERMISSIONS.map((p) => ({ permission: p, granted: granted.has(p) })),
            });
        },
    );
};

export default authController;
