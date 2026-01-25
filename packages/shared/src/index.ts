/**
 * @nekolog/shared - Shared types and schemas for NekoLog
 *
 * This package contains shared type definitions, Zod schemas,
 * and domain error types used across the frontend and backend applications.
 */

// Domain Errors (Railway Oriented Programming)
export { type DomainError, DomainErrors, fromZodError } from "./errors";
