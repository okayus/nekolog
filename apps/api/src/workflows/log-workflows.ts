/**
 * Toilet Log Management Workflows
 *
 * Domain workflows for toilet log CRUD operations.
 * Uses Railway Oriented Programming with neverthrow.
 */

import { ResultAsync, okAsync, errAsync } from "neverthrow";
import {
  DomainErrors,
  fromZodError,
  type DomainError,
  createLogSchema,
  updateLogSchema,
  logsQuerySchema,
  type CreateLogInput,
  type UpdateLogInput,
  type LogsQuery,
  type PaginatedLogs,
} from "@nekolog/shared";
import type { CatRepository } from "../repositories/cat-repository";
import type { LogRepository } from "../repositories/log-repository";
import type { ToiletLog } from "../db/schema";

/**
 * Generates a unique ID for a new log.
 * Uses crypto.randomUUID() which is available in Cloudflare Workers.
 */
const generateId = (): string => crypto.randomUUID();

/**
 * Validates input against the createLogSchema.
 *
 * @param input - Unknown input to validate
 * @returns Validated CreateLogInput or validation error
 */
const validateCreateInput = (
  input: unknown
): ResultAsync<CreateLogInput, DomainError> => {
  const result = createLogSchema.safeParse(input);
  if (!result.success) {
    return errAsync(fromZodError(result.error));
  }
  return okAsync(result.data);
};

/**
 * Validates input against the updateLogSchema.
 *
 * @param input - Unknown input to validate
 * @returns Validated UpdateLogInput or validation error
 */
const validateUpdateInput = (
  input: unknown
): ResultAsync<UpdateLogInput, DomainError> => {
  const result = updateLogSchema.safeParse(input);
  if (!result.success) {
    return errAsync(fromZodError(result.error));
  }
  return okAsync(result.data);
};

/**
 * Validates query parameters against the logsQuerySchema.
 *
 * @param query - Unknown query to validate
 * @returns Validated LogsQuery or validation error
 */
const validateLogsQuery = (
  query: unknown
): ResultAsync<LogsQuery, DomainError> => {
  const result = logsQuerySchema.safeParse(query);
  if (!result.success) {
    return errAsync(fromZodError(result.error));
  }
  return okAsync(result.data);
};

/**
 * Workflow: Add a new toilet log
 *
 * Flow: Validate input → Verify cat exists → Generate ID → Create log in DB
 *
 * @param input - Raw input from request body
 * @param userId - Authenticated user's ID
 * @param catRepo - Cat repository instance
 * @param logRepo - Log repository instance
 * @returns Created log or domain error
 */
export const addLog = (
  input: unknown,
  userId: string,
  catRepo: CatRepository,
  logRepo: LogRepository
): ResultAsync<ToiletLog, DomainError> => {
  return validateCreateInput(input).andThen((validated) => {
    // Verify cat belongs to the user
    return catRepo.findById(validated.catId, userId).andThen((cat) => {
      if (!cat) {
        return errAsync(DomainErrors.notFound("cat", validated.catId));
      }

      const id = generateId();
      const timestamp = validated.timestamp ?? new Date().toISOString();

      return logRepo.create({
        id,
        catId: validated.catId,
        type: validated.type,
        timestamp,
        note: validated.note ?? null,
      });
    });
  });
};

/**
 * Workflow: Update an existing toilet log
 *
 * Flow: Validate input → Update log in DB (includes existence check)
 *
 * @param logId - ID of the log to update
 * @param input - Raw input from request body
 * @param userId - Authenticated user's ID
 * @param logRepo - Log repository instance
 * @returns Updated log or domain error
 */
export const updateLog = (
  logId: string,
  input: unknown,
  userId: string,
  logRepo: LogRepository
): ResultAsync<ToiletLog, DomainError> => {
  return validateUpdateInput(input).andThen((validated) => {
    // Filter out undefined values to only update provided fields
    const updateData: Partial<{
      type: "urine" | "feces";
      timestamp: string;
      note: string | null;
    }> = {};

    if (validated.type !== undefined) {
      updateData.type = validated.type;
    }
    if (validated.timestamp !== undefined) {
      updateData.timestamp = validated.timestamp;
    }
    if (validated.note !== undefined) {
      updateData.note = validated.note;
    }

    return logRepo.update(logId, userId, updateData);
  });
};

/**
 * Workflow: Delete a toilet log
 *
 * Flow: Check confirmation flag → Delete log (includes existence check)
 *
 * Requires explicit confirmation to prevent accidental deletion.
 *
 * @param logId - ID of the log to delete
 * @param confirmed - Whether the user has confirmed deletion
 * @param userId - Authenticated user's ID
 * @param logRepo - Log repository instance
 * @returns void or domain error
 */
export const deleteLog = (
  logId: string,
  confirmed: boolean,
  userId: string,
  logRepo: LogRepository
): ResultAsync<void, DomainError> => {
  // Require explicit confirmation
  if (!confirmed) {
    return errAsync(DomainErrors.confirmationRequired());
  }

  return logRepo.delete(logId, userId);
};

/**
 * Workflow: Get a single toilet log by ID
 *
 * Flow: Find log → Return or error if not found
 *
 * @param logId - ID of the log to get
 * @param userId - Authenticated user's ID
 * @param logRepo - Log repository instance
 * @returns Log or not_found error
 */
export const getLog = (
  logId: string,
  userId: string,
  logRepo: LogRepository
): ResultAsync<ToiletLog, DomainError> => {
  return logRepo.findById(logId, userId).andThen((log) => {
    if (!log) {
      return errAsync(DomainErrors.notFound("toilet_log", logId));
    }
    return okAsync(log);
  });
};

/**
 * Workflow: Get toilet log history with filtering and pagination
 *
 * Flow: Validate query → Get paginated logs
 *
 * @param query - Raw query parameters
 * @param userId - Authenticated user's ID
 * @param logRepo - Log repository instance
 * @returns Paginated logs or domain error
 */
export const getHistory = (
  query: unknown,
  userId: string,
  logRepo: LogRepository
): ResultAsync<PaginatedLogs<ToiletLog>, DomainError> => {
  return validateLogsQuery(query).andThen((validatedQuery) => {
    return logRepo.findWithFilters(userId, validatedQuery);
  });
};
