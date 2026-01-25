/**
 * @nekolog/shared - Shared types and schemas for NekoLog
 *
 * This package contains shared type definitions, Zod schemas,
 * and domain error types used across the frontend and backend applications.
 */

// Domain Errors (Railway Oriented Programming)
export { type DomainError, DomainErrors, fromZodError } from "./errors";

// Zod Schemas
export {
  // Cat schemas
  createCatSchema,
  updateCatSchema,
  type CreateCatInput,
  type UpdateCatInput,
  // Toilet log schemas
  toiletTypeSchema,
  createLogSchema,
  updateLogSchema,
  logsQuerySchema,
  type ToiletType,
  type CreateLogInput,
  type UpdateLogInput,
  type LogsQuery,
  // Stats schemas
  periodSchema,
  statsQuerySchema,
  type Period,
  type StatsQuery,
  // Response types
  type CatSummary,
  type DailySummary,
  type ChartDataPoint,
  type ChartData,
  type PaginatedLogs,
  type Cat,
  type ToiletLog,
} from "./schemas";
