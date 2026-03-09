/**
 * Authentication Middleware
 *
 * Provides authentication for API routes.
 * Injects the authenticated user's ID into the request context.
 *
 * Note: Phase 2 will replace this stub with full Better Auth session validation.
 * Currently, the middleware is a passthrough placeholder after Clerk removal.
 */

import { createMiddleware } from "hono/factory";
import { DomainErrors, type DomainError } from "@nekolog/shared";
import type { Bindings, Variables } from "../types";

/**
 * Authentication middleware placeholder.
 * Phase 2 will implement Better Auth session validation here.
 */
export const authMiddleware = () =>
  createMiddleware<{
    Bindings: Bindings;
    Variables: Variables;
  }>(async (_c, next) => {
    await next();
  });

/**
 * Middleware that requires authentication.
 * Returns 401 Unauthorized if the user is not authenticated.
 * Sets userId in context variables for downstream handlers.
 *
 * Note: Phase 2 will replace the session extraction with Better Auth.
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
