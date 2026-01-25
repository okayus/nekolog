/**
 * Clerk Authentication Middleware
 *
 * Provides authentication for API routes using Clerk.
 * Injects the authenticated user's ID into the request context.
 */

import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { createMiddleware } from "hono/factory";
import { DomainErrors, type DomainError } from "@nekolog/shared";
import type { Bindings, Variables } from "../types";

/**
 * Clerk middleware that injects session into context.
 * This should be applied to all routes that need authentication.
 */
export const clerkAuth = () => clerkMiddleware();

/**
 * Middleware that requires authentication.
 * Returns 401 Unauthorized if the user is not authenticated.
 * Sets userId in context variables for downstream handlers.
 */
export const requireAuth = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    const error: DomainError = DomainErrors.unauthorized(
      "認証が必要です。ログインしてください。"
    );
    return c.json({ error }, 401);
  }

  // Set userId in context for downstream handlers
  c.set("userId", auth.userId);

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
