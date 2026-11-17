import type { FastifyReply, FastifyRequest } from "fastify";
import type { Permission, Role } from "../config/constants.ts";
import type { Container } from "../container.ts";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: Role;
}

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: { sub: string };
        user: AuthUser;
    }
}

declare module "fastify" {
    interface FastifyInstance {
        deps: Container;
        authenticate: (request: FastifyRequest) => Promise<void>;
        authorize: (
            ...permissions: Permission[]
        ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        signAccessToken: (userId: string) => string;
        // Added by @fastify/swagger
        swagger: ((opts?: { yaml?: false }) => Record<string, unknown>) & ((opts: { yaml: true }) => string);
        swaggerCSP: { script: string[]; style: string[] };
        // Added by @fastify/jwt
        jwt: {
            sign: (payload: Record<string, unknown>, options?: Record<string, unknown>) => string;
            verify: <T = Record<string, unknown>>(token: string, options?: Record<string, unknown>) => T;
            decode: <T = Record<string, unknown>>(token: string, options?: Record<string, unknown>) => T | null;
            options: Record<string, unknown>;
        };
    }

    interface FastifyRequest {
        rawBody?: Buffer;
        // Added by @fastify/jwt via FastifyJWT.user declaration merging
        user: AuthUser;
        jwtVerify: <T = AuthUser>() => Promise<T>;
    }

    interface FastifySchema {
        // Added by @fastify/swagger
        hide?: boolean;
        deprecated?: boolean;
        tags?: readonly string[];
        description?: string;
        summary?: string;
        consumes?: readonly string[];
        produces?: readonly string[];
        security?: ReadonlyArray<{ [securityLabel: string]: readonly string[] }>;
    }
}
