/**
 * Domain Error Types for Railway Oriented Programming
 *
 * Based on Domain Modeling Made Functional approach.
 * Uses discriminated unions for type-safe error handling.
 */

import { z } from "zod";

/**
 * Discriminated union type for all domain errors.
 * Each error type has a unique `type` property for pattern matching.
 */
export type DomainError =
  | { type: "validation"; field: string; message: string }
  | { type: "not_found"; resource: string; id: string }
  | { type: "unauthorized"; message: string }
  | { type: "confirmation_required" }
  | { type: "database"; message: string };

/**
 * Type-safe error constructors for creating DomainError instances.
 */
export const DomainErrors = {
  /**
   * Creates a validation error for invalid input.
   * @param field - The field that failed validation
   * @param message - Human-readable error message
   */
  validation: (field: string, message: string): DomainError => ({
    type: "validation",
    field,
    message,
  }),

  /**
   * Creates a not found error for missing resources.
   * @param resource - The type of resource (e.g., "cat", "log")
   * @param id - The ID of the resource that was not found
   */
  notFound: (resource: string, id: string): DomainError => ({
    type: "not_found",
    resource,
    id,
  }),

  /**
   * Creates an unauthorized error for authentication failures.
   * @param message - Human-readable error message
   */
  unauthorized: (message: string): DomainError => ({
    type: "unauthorized",
    message,
  }),

  /**
   * Creates a confirmation required error.
   * Used when a destructive action requires explicit user confirmation.
   */
  confirmationRequired: (): DomainError => ({
    type: "confirmation_required",
  }),

  /**
   * Creates a database error for data access failures.
   * @param message - Human-readable error message (internal details should be logged, not exposed)
   */
  database: (message: string): DomainError => ({
    type: "database",
    message,
  }),
} as const;

/**
 * Converts a Zod validation error to a DomainError.
 * Extracts the first error from the ZodError for simplicity.
 *
 * @param error - The Zod error to convert
 * @returns A DomainError of type "validation"
 */
export const fromZodError = (error: z.ZodError): DomainError => {
  const firstIssue = error.issues[0];
  const field = firstIssue?.path.join(".") || "unknown";
  const message = firstIssue?.message ?? "Validation failed";

  return DomainErrors.validation(field, message);
};
