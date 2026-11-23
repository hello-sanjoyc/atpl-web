import {
    LOGIN_LOCK_MINUTES,
    LOGIN_MAX_FAILURES,
} from "../../config/constants.js";
import type { Container } from "../../container.js";
import { AuthenticationError } from "../../errors/app.error.js";
import { ErrorCodes } from "../../errors/error-codes.js";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "../../utils/password.js";
import {
    findUserByEmail,
    recordFailedLogin,
    resetLoginState,
} from "../users/users.repository.js";
import { fingerprint } from "../../logger/correlation.js";

export interface LoginResult {
    accessToken: string;
    tokenType: "Bearer";
    user: { id: string; email: string; name: string; role: string };
}

export interface LoginContext {
    ip?: string;
    userAgent?: string;
}

export function createAuthService(
    deps: Container,
    signAccessToken: (userId: string) => string,
) {
    const { db, security, logger, now } = deps;
    const log = logger.child({ module: "auth" });

    return {
        async login(
            emailInput: string,
            password: string,
            context: LoginContext = {},
        ): Promise<LoginResult> {
            const email = emailInput.toLowerCase();
            const user = await findUserByEmail(db, email);

            if (!user) {
                // Equalise timing with the existing-account path to resist account enumeration.
                await verifyPassword(password, DUMMY_PASSWORD_HASH);
                security.record("auth.login_failed", {
                    reason: "unknown_account",
                    emailFingerprint: fingerprint(email),
                    ...context,
                });
                throw new AuthenticationError(
                    ErrorCodes.INVALID_CREDENTIALS,
                    "The email or password is incorrect.",
                );
            }

            if (user.lockedUntil && user.lockedUntil > now()) {
                security.record("auth.login_failed", {
                    reason: "locked",
                    userId: user.id,
                    ...context,
                });
                throw new AuthenticationError(
                    ErrorCodes.ACCOUNT_LOCKED,
                    "The account is temporarily locked. Please try again later.",
                );
            }

            const valid = await verifyPassword(password, user.passwordHash);
            if (!valid || !user.isActive) {
                const failures = user.failedLoginCount + 1;
                const lockedUntil =
                    failures >= LOGIN_MAX_FAILURES
                        ? new Date(
                              now().getTime() + LOGIN_LOCK_MINUTES * 60_000,
                          )
                        : null;
                await recordFailedLogin(
                    db,
                    user.id,
                    lockedUntil ? 0 : failures,
                    lockedUntil,
                );
                if (lockedUntil) {
                    security.record(
                        "auth.account_locked",
                        { userId: user.id, lockMinutes: LOGIN_LOCK_MINUTES, ...context },
                        "error",
                    );
                } else {
                    security.record("auth.login_failed", {
                        reason: valid ? "inactive" : "bad_password",
                        userId: user.id,
                        failures,
                        ...context,
                    });
                }
                throw new AuthenticationError(
                    ErrorCodes.INVALID_CREDENTIALS,
                    "The email or password is incorrect.",
                );
            }

            await resetLoginState(db, user.id);
            security.record("auth.login_success", { userId: user.id, ...context }, "warn");
            log.info(
                { event: "auth.login_success", userId: user.id },
                "Login succeeded",
            );
            return {
                accessToken: signAccessToken(user.id),
                tokenType: "Bearer",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            };
        },
    };
}
