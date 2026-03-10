/**
 * Authentication Middleware
 *
 * Provides authentication for API routes using Better Auth.
 * Validates session from request headers and injects userId into context.
 */

import { createMiddleware } from "hono/factory";
import { DomainErrors, type DomainError } from "@nekolog/shared";
import { createAuth } from "../lib/auth";
import type { Bindings, Variables } from "../types";

/**
 * Authentication middleware that validates Better Auth sessions.
 * If a valid session exists, sets userId in context.
 * Non-authenticated requests pass through (use requireAuth for protected routes).
 */
export const authMiddleware = () =>
  createMiddleware<{
    Bindings: Bindings;
    Variables: Variables;
  }>(async (c, next) => {
    const auth = createAuth(c.env);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session?.user) {
      c.set("userId", session.user.id);
    }

    await next();
  });

/**
 * Middleware that requires authentication.
 * Returns 401 Unauthorized if the user is not authenticated.
 * Must be applied after authMiddleware.
 */
export const requireAuth = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const userId = c.get("userId");

  if (!userId) {
    const error: DomainError = DomainErrors.unauthorized(
      "認証が必要です。ログインしてください。"
    );
    return c.json({ error }, 401);
  }

  await next();
});

/**
 * Get the authenticated user's ID from context.
 * Should only be called after requireAuth middleware.
 *
 * @param c - Hono context
 * @returns The authenticated user's ID
 * @throws Error if userId is not set (shouldn't happen after requireAuth)
 */
export const getUserId = (c: { get: (key: "userId") => string | undefined }): string => {
  const userId = c.get("userId");
  if (!userId) {
    throw new Error("userId is not set. Ensure requireAuth middleware is applied.");
  }
  return userId;
};
