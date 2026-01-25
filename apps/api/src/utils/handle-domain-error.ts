/**
 * Domain Error Handler Utility
 *
 * Converts DomainError to HTTP responses for API routes.
 * Provides consistent error response format across all endpoints.
 */

import type { Context } from "hono";
import type { DomainError } from "@nekolog/shared";

/**
 * API error response format.
 * All error responses follow this structure.
 */
export interface ApiErrorResponse {
  error: DomainError | { type: "internal"; message: string };
}

/**
 * Converts a DomainError to an appropriate HTTP response.
 *
 * Error type to HTTP status code mapping:
 * - validation → 400 Bad Request
 * - not_found → 404 Not Found
 * - unauthorized → 401 Unauthorized
 * - confirmation_required → 422 Unprocessable Entity
 * - database → 500 Internal Server Error (with generic message)
 *
 * @param c - Hono context
 * @param error - DomainError to convert
 * @returns HTTP response with appropriate status code and error body
 */
export const handleDomainError = (
  c: Context,
  error: DomainError
): Response => {
  switch (error.type) {
    case "validation":
      return c.json<ApiErrorResponse>({ error }, 400);

    case "not_found":
      return c.json<ApiErrorResponse>({ error }, 404);

    case "unauthorized":
      return c.json<ApiErrorResponse>({ error }, 401);

    case "confirmation_required":
      return c.json<ApiErrorResponse>({ error }, 422);

    case "database":
      // Don't expose internal database error details to clients
      // Log the actual error for debugging (in production, use proper logging)
      console.error("[Database Error]", error.message);
      return c.json<ApiErrorResponse>(
        {
          error: {
            type: "internal",
            message: "サーバーエラーが発生しました。しばらく経ってから再度お試しください。",
          },
        },
        500
      );
  }
};

/**
 * Helper type for use with neverthrow's match() function.
 * Returns Response type for both success and error cases.
 */
export type ErrorHandler = (error: DomainError) => Response;
