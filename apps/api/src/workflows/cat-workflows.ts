/**
 * Cat Management Workflows
 *
 * Domain workflows for cat CRUD operations.
 * Uses Railway Oriented Programming with neverthrow.
 */

import { ResultAsync, okAsync, errAsync } from "neverthrow";
import {
  DomainErrors,
  fromZodError,
  type DomainError,
  createCatSchema,
  updateCatSchema,
  type CreateCatInput,
  type UpdateCatInput,
} from "@nekolog/shared";
import type { CatRepository } from "../repositories/cat-repository";
import type { Cat } from "../db/schema";

/**
 * Generates a unique ID for a new cat.
 * Uses crypto.randomUUID() which is available in Cloudflare Workers.
 */
const generateId = (): string => crypto.randomUUID();

/**
 * Validates input against the createCatSchema.
 *
 * @param input - Unknown input to validate
 * @returns Validated CreateCatInput or validation error
 */
const validateCreateInput = (
  input: unknown
): ResultAsync<CreateCatInput, DomainError> => {
  const result = createCatSchema.safeParse(input);
  if (!result.success) {
    return errAsync(fromZodError(result.error));
  }
  return okAsync(result.data);
};

/**
 * Validates input against the updateCatSchema.
 *
 * @param input - Unknown input to validate
 * @returns Validated UpdateCatInput or validation error
 */
const validateUpdateInput = (
  input: unknown
): ResultAsync<UpdateCatInput, DomainError> => {
  const result = updateCatSchema.safeParse(input);
  if (!result.success) {
    return errAsync(fromZodError(result.error));
  }
  return okAsync(result.data);
};

/**
 * Workflow: Register a new cat
 *
 * Flow: Validate input → Generate ID → Create cat in DB
 *
 * @param input - Raw input from request body
 * @param userId - Authenticated user's ID
 * @param catRepo - Cat repository instance
 * @returns Created cat or domain error
 */
export const registerCat = (
  input: unknown,
  userId: string,
  catRepo: CatRepository
): ResultAsync<Cat, DomainError> => {
  return validateCreateInput(input).andThen((validated) => {
    const id = generateId();
    return catRepo.create({
      id,
      userId,
      name: validated.name,
      birthDate: validated.birthDate ?? null,
      breed: validated.breed ?? null,
      weight: validated.weight ?? null,
    });
  });
};

/**
 * Workflow: Update an existing cat
 *
 * Flow: Validate input → Update cat in DB (includes existence check)
 *
 * @param catId - ID of the cat to update
 * @param input - Raw input from request body
 * @param userId - Authenticated user's ID
 * @param catRepo - Cat repository instance
 * @returns Updated cat or domain error
 */
export const updateCat = (
  catId: string,
  input: unknown,
  userId: string,
  catRepo: CatRepository
): ResultAsync<Cat, DomainError> => {
  return validateUpdateInput(input).andThen((validated) => {
    // Filter out undefined values to only update provided fields
    const updateData: Partial<{
      name: string;
      birthDate: string | null;
      breed: string | null;
      weight: number | null;
    }> = {};

    if (validated.name !== undefined) {
      updateData.name = validated.name;
    }
    if (validated.birthDate !== undefined) {
      updateData.birthDate = validated.birthDate;
    }
    if (validated.breed !== undefined) {
      updateData.breed = validated.breed;
    }
    if (validated.weight !== undefined) {
      updateData.weight = validated.weight;
    }

    return catRepo.update(catId, userId, updateData);
  });
};

/**
 * Workflow: Delete a cat
 *
 * Flow: Check confirmation flag → Delete cat (includes existence check)
 *
 * Requires explicit confirmation to prevent accidental deletion.
 * Related toilet logs are deleted via CASCADE in the database.
 *
 * @param catId - ID of the cat to delete
 * @param confirmed - Whether the user has confirmed deletion
 * @param userId - Authenticated user's ID
 * @param catRepo - Cat repository instance
 * @returns void or domain error
 */
export const deleteCat = (
  catId: string,
  confirmed: boolean,
  userId: string,
  catRepo: CatRepository
): ResultAsync<void, DomainError> => {
  // Require explicit confirmation
  if (!confirmed) {
    return errAsync(DomainErrors.confirmationRequired());
  }

  return catRepo.delete(catId, userId);
};

/**
 * Workflow: Get a single cat by ID
 *
 * Flow: Find cat → Return or error if not found
 *
 * @param catId - ID of the cat to get
 * @param userId - Authenticated user's ID
 * @param catRepo - Cat repository instance
 * @returns Cat or not_found error
 */
export const getCat = (
  catId: string,
  userId: string,
  catRepo: CatRepository
): ResultAsync<Cat, DomainError> => {
  return catRepo.findById(catId, userId).andThen((cat) => {
    if (!cat) {
      return errAsync(DomainErrors.notFound("cat", catId));
    }
    return okAsync(cat);
  });
};

/**
 * Workflow: List all cats for a user
 *
 * Flow: Get all cats for user
 *
 * @param userId - Authenticated user's ID
 * @param catRepo - Cat repository instance
 * @returns Array of cats (may be empty)
 */
export const listCats = (
  userId: string,
  catRepo: CatRepository
): ResultAsync<Cat[], DomainError> => {
  return catRepo.findAllByUserId(userId);
};
