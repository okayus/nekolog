/**
 * Toilet Log Repository
 *
 * Data access layer for toilet log management.
 * Uses Drizzle ORM with D1 database.
 * Returns ResultAsync for Railway Oriented Programming.
 */

import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { ResultAsync } from "neverthrow";
import {
  DomainErrors,
  type DomainError,
  type LogsQuery,
  type PaginatedLogs,
} from "@nekolog/shared";
import { toiletLogs, cats, type ToiletLog, type NewToiletLog } from "../db/schema";

/**
 * Log Repository Interface
 * Defines the contract for toilet log data access operations.
 */
export interface LogRepository {
  create(log: NewToiletLog): ResultAsync<ToiletLog, DomainError>;
  update(
    id: string,
    userId: string,
    data: Partial<Omit<NewToiletLog, "id" | "catId">>
  ): ResultAsync<ToiletLog, DomainError>;
  delete(id: string, userId: string): ResultAsync<void, DomainError>;
  findById(id: string, userId: string): ResultAsync<ToiletLog | null, DomainError>;
  findWithFilters(
    userId: string,
    query: LogsQuery
  ): ResultAsync<PaginatedLogs<ToiletLog>, DomainError>;
}

/**
 * Creates a LogRepository instance with the given D1 database.
 *
 * @param db - D1Database instance
 * @returns LogRepository implementation
 */
export const createLogRepository = (db: D1Database): LogRepository => {
  const drizzleDb = drizzle(db);

  /**
   * Helper to verify log belongs to user's cat.
   * Joins toilet_logs with cats to check ownership.
   */
  const findLogWithOwnership = async (
    logId: string,
    userId: string
  ): Promise<ToiletLog | null> => {
    const result = await drizzleDb
      .select({
        log: toiletLogs,
      })
      .from(toiletLogs)
      .innerJoin(cats, eq(toiletLogs.catId, cats.id))
      .where(and(eq(toiletLogs.id, logId), eq(cats.userId, userId)));

    return result[0]?.log ?? null;
  };

  return {
    /**
     * Creates a new toilet log in the database.
     *
     * @param log - New log data including id and catId
     * @returns Created log or database error
     */
    create: (log: NewToiletLog): ResultAsync<ToiletLog, DomainError> => {
      return ResultAsync.fromPromise(
        drizzleDb
          .insert(toiletLogs)
          .values({
            ...log,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning()
          .then((rows) => rows[0]!),
        (error) => {
          console.error("[LogRepository.create]", error);
          return DomainErrors.database("Failed to create toilet log");
        }
      );
    },

    /**
     * Updates an existing toilet log.
     * Only updates if the log belongs to a cat owned by the specified user.
     *
     * @param id - Log ID to update
     * @param userId - Owner user ID (for authorization check via cat ownership)
     * @param data - Partial log data to update
     * @returns Updated log or error (not_found if log doesn't exist or unauthorized)
     */
    update: (
      id: string,
      userId: string,
      data: Partial<Omit<NewToiletLog, "id" | "catId">>
    ): ResultAsync<ToiletLog, DomainError> => {
      return ResultAsync.fromPromise(
        (async () => {
          // First verify ownership
          const existingLog = await findLogWithOwnership(id, userId);
          if (!existingLog) {
            throw new Error("NOT_FOUND");
          }

          // Then update
          const updated = await drizzleDb
            .update(toiletLogs)
            .set({
              ...data,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(toiletLogs.id, id))
            .returning();

          return updated[0]!;
        })(),
        (error) => {
          if (error instanceof Error && error.message === "NOT_FOUND") {
            return DomainErrors.notFound("toilet_log", id);
          }
          console.error("[LogRepository.update]", error);
          return DomainErrors.database("Failed to update toilet log");
        }
      );
    },

    /**
     * Deletes a toilet log by ID.
     * Only deletes if the log belongs to a cat owned by the specified user.
     *
     * @param id - Log ID to delete
     * @param userId - Owner user ID (for authorization check via cat ownership)
     * @returns void or error (not_found if log doesn't exist or unauthorized)
     */
    delete: (id: string, userId: string): ResultAsync<void, DomainError> => {
      return ResultAsync.fromPromise(
        (async () => {
          // First verify ownership
          const existingLog = await findLogWithOwnership(id, userId);
          if (!existingLog) {
            throw new Error("NOT_FOUND");
          }

          // Then delete
          await drizzleDb.delete(toiletLogs).where(eq(toiletLogs.id, id));
        })(),
        (error) => {
          if (error instanceof Error && error.message === "NOT_FOUND") {
            return DomainErrors.notFound("toilet_log", id);
          }
          console.error("[LogRepository.delete]", error);
          return DomainErrors.database("Failed to delete toilet log");
        }
      );
    },

    /**
     * Finds a toilet log by ID.
     * Only returns the log if it belongs to a cat owned by the specified user.
     *
     * @param id - Log ID to find
     * @param userId - Owner user ID (for authorization check via cat ownership)
     * @returns Log if found, null if not found, or database error
     */
    findById: (
      id: string,
      userId: string
    ): ResultAsync<ToiletLog | null, DomainError> => {
      return ResultAsync.fromPromise(findLogWithOwnership(id, userId), (error) => {
        console.error("[LogRepository.findById]", error);
        return DomainErrors.database("Failed to find toilet log");
      });
    },

    /**
     * Finds toilet logs with filtering and pagination.
     * Only returns logs for cats owned by the specified user.
     *
     * @param userId - Owner user ID (for authorization)
     * @param query - Query parameters for filtering and pagination
     * @returns Paginated logs or database error
     */
    findWithFilters: (
      userId: string,
      query: LogsQuery
    ): ResultAsync<PaginatedLogs<ToiletLog>, DomainError> => {
      return ResultAsync.fromPromise(
        (async () => {
          const { catId, type, from, to, page, limit } = query;
          const offset = (page - 1) * limit;

          // Build WHERE conditions
          const conditions = [eq(cats.userId, userId)];

          if (catId) {
            conditions.push(eq(toiletLogs.catId, catId));
          }
          if (type) {
            conditions.push(eq(toiletLogs.type, type));
          }
          if (from) {
            conditions.push(gte(toiletLogs.timestamp, from));
          }
          if (to) {
            conditions.push(lte(toiletLogs.timestamp, to));
          }

          // Get total count
          const countResult = await drizzleDb
            .select({ count: sql<number>`count(*)` })
            .from(toiletLogs)
            .innerJoin(cats, eq(toiletLogs.catId, cats.id))
            .where(and(...conditions));

          const total = countResult[0]?.count ?? 0;

          // Get paginated logs
          const logs = await drizzleDb
            .select({
              id: toiletLogs.id,
              catId: toiletLogs.catId,
              type: toiletLogs.type,
              timestamp: toiletLogs.timestamp,
              note: toiletLogs.note,
              createdAt: toiletLogs.createdAt,
              updatedAt: toiletLogs.updatedAt,
            })
            .from(toiletLogs)
            .innerJoin(cats, eq(toiletLogs.catId, cats.id))
            .where(and(...conditions))
            .orderBy(desc(toiletLogs.timestamp))
            .limit(limit)
            .offset(offset);

          return {
            logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          };
        })(),
        (error) => {
          console.error("[LogRepository.findWithFilters]", error);
          return DomainErrors.database("Failed to find toilet logs");
        }
      );
    },
  };
};
