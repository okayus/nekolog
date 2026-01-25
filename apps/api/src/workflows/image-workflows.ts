/**
 * Image Upload Workflows
 *
 * Domain workflows for cat image upload operations.
 * Uses Railway Oriented Programming with neverthrow.
 */

import { ResultAsync, errAsync } from "neverthrow";
import { DomainErrors, type DomainError } from "@nekolog/shared";
import type { CatRepository } from "../repositories/cat-repository";
import type { ImageStorageService } from "../services/image-storage";
import type { Cat } from "../db/schema";

/**
 * Workflow: Upload a cat image
 *
 * Flow: Verify cat exists → Upload image to R2 → Update cat's imageUrl
 *
 * @param catId - ID of the cat to upload image for
 * @param file - Image file to upload
 * @param userId - Authenticated user's ID
 * @param catRepo - Cat repository instance
 * @param imageStorage - Image storage service instance
 * @returns Updated cat with new imageUrl or domain error
 */
export const uploadCatImage = (
  catId: string,
  file: File | null,
  userId: string,
  catRepo: CatRepository,
  imageStorage: ImageStorageService
): ResultAsync<Cat, DomainError> => {
  // Validate file is provided
  if (!file) {
    return errAsync(
      DomainErrors.validation("image", "画像ファイルが必要です")
    );
  }

  // First check if cat exists and belongs to user
  return catRepo
    .findById(catId, userId)
    .andThen((cat) => {
      if (!cat) {
        return errAsync(DomainErrors.notFound("cat", catId));
      }

      // Upload image to R2
      const path = `cats/${catId}`;
      return imageStorage.upload(file, path);
    })
    .andThen((uploadResult) => {
      // Update cat with new image URL
      return catRepo.update(catId, userId, {
        imageUrl: uploadResult.url,
      });
    });
};

/**
 * Workflow: Delete a cat image
 *
 * Flow: Verify cat exists → Delete image from R2 → Clear cat's imageUrl
 *
 * @param catId - ID of the cat to delete image for
 * @param userId - Authenticated user's ID
 * @param catRepo - Cat repository instance
 * @param imageStorage - Image storage service instance
 * @returns Updated cat with cleared imageUrl or domain error
 */
export const deleteCatImage = (
  catId: string,
  userId: string,
  catRepo: CatRepository,
  imageStorage: ImageStorageService
): ResultAsync<Cat, DomainError> => {
  return catRepo.findById(catId, userId).andThen((cat) => {
    if (!cat) {
      return errAsync(DomainErrors.notFound("cat", catId));
    }

    if (!cat.imageUrl) {
      // No image to delete, just return the cat
      return catRepo.update(catId, userId, { imageUrl: null });
    }

    // Extract key from URL and delete from R2
    // URL format: {publicUrl}/{key}
    const urlParts = cat.imageUrl.split("/");
    const key = urlParts.slice(-3).join("/"); // cats/{catId}/{timestamp}.{ext}

    return imageStorage.delete(key).andThen(() => {
      return catRepo.update(catId, userId, { imageUrl: null });
    });
  });
};
