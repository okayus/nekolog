/**
 * Zod Schemas for NekoLog
 *
 * Shared validation schemas for API requests and responses.
 * Used across frontend and backend for type-safe validation.
 */

import { z } from "zod";

// =============================================================================
// Cat Schemas
// =============================================================================

/**
 * Schema for creating a new cat.
 * Name is required, other fields are optional.
 */
export const createCatSchema = z.object({
  name: z
    .string()
    .min(1, { message: "名前は必須です" })
    .max(50, { message: "名前は50文字以内で入力してください" }),
  birthDate: z.string().datetime({ message: "有効な日時形式で入力してください" }).optional(),
  breed: z.string().max(50, { message: "品種は50文字以内で入力してください" }).optional(),
  weight: z.number().positive({ message: "体重は正の数で入力してください" }).optional(),
});

/**
 * Schema for updating an existing cat.
 * All fields are optional.
 */
export const updateCatSchema = createCatSchema.partial();

export type CreateCatInput = z.infer<typeof createCatSchema>;
export type UpdateCatInput = z.infer<typeof updateCatSchema>;

// =============================================================================
// Toilet Log Schemas
// =============================================================================

/**
 * Schema for toilet type.
 * Either 'urine' (排尿) or 'feces' (排便).
 */
export const toiletTypeSchema = z.enum(["urine", "feces"]);

export type ToiletType = z.infer<typeof toiletTypeSchema>;

/**
 * Schema for creating a new toilet log.
 * catId and type are required.
 */
export const createLogSchema = z.object({
  catId: z.string().uuid({ message: "有効な猫IDを指定してください" }),
  type: toiletTypeSchema,
  timestamp: z.string().datetime({ message: "有効な日時形式で入力してください" }).optional(),
  note: z.string().max(500, { message: "メモは500文字以内で入力してください" }).optional(),
});

/**
 * Schema for updating an existing toilet log.
 * All fields are optional.
 */
export const updateLogSchema = createLogSchema.partial();

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type UpdateLogInput = z.infer<typeof updateLogSchema>;

/**
 * Schema for querying toilet logs with filtering and pagination.
 */
export const logsQuerySchema = z.object({
  catId: z.string().uuid().optional(),
  type: toiletTypeSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type LogsQuery = z.infer<typeof logsQuerySchema>;

// =============================================================================
// Stats Schemas
// =============================================================================

/**
 * Schema for time period selection.
 */
export const periodSchema = z.enum(["today", "week", "month"]);

export type Period = z.infer<typeof periodSchema>;

/**
 * Schema for querying statistics.
 */
export const statsQuerySchema = z.object({
  catId: z.string().uuid().optional(),
  period: periodSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type StatsQuery = z.infer<typeof statsQuerySchema>;

// =============================================================================
// Response Types (for API responses)
// =============================================================================

/**
 * Summary of a single cat's toilet activity.
 */
export interface CatSummary {
  catId: string;
  catName: string;
  urineCount: number;
  fecesCount: number;
  totalCount: number;
}

/**
 * Daily summary of all cats' toilet activity.
 */
export interface DailySummary {
  date: string;
  cats: CatSummary[];
  totalUrineCount: number;
  totalFecesCount: number;
  totalCount: number;
}

/**
 * Single data point for chart visualization.
 */
export interface ChartDataPoint {
  date: string;
  urineCount: number;
  fecesCount: number;
  totalCount: number;
}

/**
 * Chart data for statistics visualization.
 */
export interface ChartData {
  catId: string | null;
  catName: string | null;
  period: "daily" | "weekly" | "monthly";
  data: ChartDataPoint[];
}

/**
 * Paginated response for toilet logs.
 */
export interface PaginatedLogs<T> {
  logs: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Cat entity returned from API.
 */
export interface Cat {
  id: string;
  userId: string;
  name: string;
  birthDate: string | null;
  breed: string | null;
  weight: number | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Toilet log entity returned from API.
 */
export interface ToiletLog {
  id: string;
  catId: string;
  type: ToiletType;
  timestamp: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}
