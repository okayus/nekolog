/**
 * Cat Repository
 *
 * Data access layer for cat management.
 * Uses Drizzle ORM with D1 database.
 * Returns ResultAsync for Railway Oriented Programming.
 */

import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { ResultAsync, okAsync, errAsync } from "neverthrow";
import { DomainErrors, type DomainError } from "@nekolog/shared";
import { cats, type Cat, type NewCat } from "../db/schema";

/**
 * Cat Repository Interface
 * Defines the contract for cat data access operations.
 */
export interface CatRepository {
  create(cat: NewCat): ResultAsync<Cat, DomainError>;
  update(
    id: string,
    userId: string,
    data: Partial<Omit<NewCat, "id" | "userId">>
  ): ResultAsync<Cat, DomainError>;
  delete(id: string, userId: string): ResultAsync<void, DomainError>;
  findById(id: string, userId: string): ResultAsync<Cat | null, DomainError>;
  findAllByUserId(userId: string): ResultAsync<Cat[], DomainError>;
}

/**
 * Creates a CatRepository instance with the given D1 database.
 *
 * @param db - D1Database instance
 * @returns CatRepository implementation
 */
export const createCatRepository = (db: D1Database): CatRepository => {
  const drizzleDb = drizzle(db);

  return {
    /**
     * Creates a new cat in the database.
     *
     * @param cat - New cat data including id and userId
     * @returns Created cat or database error
     */
    create: (cat: NewCat): ResultAsync<Cat, DomainError> => {
      return ResultAsync.fromPromise(
        drizzleDb
          .insert(cats)
          .values({
            ...cat,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning()
          .then((rows) => rows[0]!),
        (error) => {
          console.error("[CatRepository.create]", error);
          return DomainErrors.database("Failed to create cat");
        }
      );
    },

    /**
     * Updates an existing cat.
     * Only updates if the cat belongs to the specified user.
     *
     * @param id - Cat ID to update
     * @param userId - Owner user ID (for authorization check)
     * @param data - Partial cat data to update
     * @returns Updated cat or error (not_found if cat doesn't exist or belongs to another user)
     */
    update: (
      id: string,
      userId: string,
      data: Partial<Omit<NewCat, "id" | "userId">>
    ): ResultAsync<Cat, DomainError> => {
      return ResultAsync.fromPromise(
        drizzleDb
          .update(cats)
          .set({
            ...data,
            updatedAt: new Date().toISOString(),
          })
          .where(and(eq(cats.id, id), eq(cats.userId, userId)))
          .returning()
          .then((rows) => {
            if (rows.length === 0) {
              throw new Error("NOT_FOUND");
            }
            return rows[0]!;
          }),
        (error) => {
          if (error instanceof Error && error.message === "NOT_FOUND") {
            return DomainErrors.notFound("cat", id);
          }
          console.error("[CatRepository.update]", error);
          return DomainErrors.database("Failed to update cat");
        }
      );
    },

    /**
     * Deletes a cat by ID.
     * Only deletes if the cat belongs to the specified user.
     * Related toilet logs are deleted via CASCADE.
     *
     * @param id - Cat ID to delete
     * @param userId - Owner user ID (for authorization check)
     * @returns void or error (not_found if cat doesn't exist or belongs to another user)
     */
    delete: (id: string, userId: string): ResultAsync<void, DomainError> => {
      return ResultAsync.fromPromise(
        drizzleDb
          .delete(cats)
          .where(and(eq(cats.id, id), eq(cats.userId, userId)))
          .returning({ id: cats.id })
          .then((rows) => {
            if (rows.length === 0) {
              throw new Error("NOT_FOUND");
            }
          }),
        (error) => {
          if (error instanceof Error && error.message === "NOT_FOUND") {
            return DomainErrors.notFound("cat", id);
          }
          console.error("[CatRepository.delete]", error);
          return DomainErrors.database("Failed to delete cat");
        }
      );
    },

    /**
     * Finds a cat by ID.
     * Only returns the cat if it belongs to the specified user.
     *
     * @param id - Cat ID to find
     * @param userId - Owner user ID (for authorization check)
     * @returns Cat if found, null if not found, or database error
     */
    findById: (
      id: string,
      userId: string
    ): ResultAsync<Cat | null, DomainError> => {
      return ResultAsync.fromPromise(
        drizzleDb
          .select()
          .from(cats)
          .where(and(eq(cats.id, id), eq(cats.userId, userId)))
          .then((rows) => rows[0] ?? null),
        (error) => {
          console.error("[CatRepository.findById]", error);
          return DomainErrors.database("Failed to find cat");
        }
      );
    },

    /**
     * Finds all cats belonging to a user.
     *
     * @param userId - Owner user ID
     * @returns Array of cats (empty if none found) or database error
     */
    findAllByUserId: (userId: string): ResultAsync<Cat[], DomainError> => {
      return ResultAsync.fromPromise(
        drizzleDb.select().from(cats).where(eq(cats.userId, userId)),
        (error) => {
          console.error("[CatRepository.findAllByUserId]", error);
          return DomainErrors.database("Failed to find cats");
        }
      );
    },
  };
};
