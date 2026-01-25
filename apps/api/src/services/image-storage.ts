/**
 * Image Storage Service
 *
 * Handles image upload and storage using Cloudflare R2.
 * Returns ResultAsync for Railway Oriented Programming.
 */

import { ResultAsync, okAsync, errAsync } from "neverthrow";
import { DomainErrors, type DomainError } from "@nekolog/shared";

/**
 * Supported image MIME types
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Image upload result containing the URL
 */
export interface ImageUploadResult {
  url: string;
  key: string;
}

/**
 * Image Storage Service Interface
 */
export interface ImageStorageService {
  upload(
    file: File,
    path: string
  ): ResultAsync<ImageUploadResult, DomainError>;
  delete(key: string): ResultAsync<void, DomainError>;
}

/**
 * Validates the uploaded file.
 *
 * @param file - The file to validate
 * @returns Validated file or validation error
 */
const validateFile = (file: File): ResultAsync<File, DomainError> => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return errAsync(
      DomainErrors.validation(
        "image",
        `ファイルサイズは${MAX_FILE_SIZE / 1024 / 1024}MB以下にしてください`
      )
    );
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return errAsync(
      DomainErrors.validation(
        "image",
        "対応していないファイル形式です。JPEG、PNG、GIF、WebP のみ対応しています"
      )
    );
  }

  return okAsync(file);
};

/**
 * Gets file extension from MIME type
 */
const getExtension = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return extensions[mimeType] ?? "bin";
};

/**
 * Creates an ImageStorageService instance with the given R2 bucket.
 *
 * @param bucket - R2Bucket instance
 * @param publicUrl - Base URL for public access to the bucket
 * @returns ImageStorageService implementation
 */
export const createImageStorageService = (
  bucket: R2Bucket,
  publicUrl: string
): ImageStorageService => {
  return {
    /**
     * Uploads an image to R2.
     *
     * @param file - The image file to upload
     * @param path - The path prefix for the file (e.g., "cats/cat_123")
     * @returns Upload result with URL and key, or validation/database error
     */
    upload: (
      file: File,
      path: string
    ): ResultAsync<ImageUploadResult, DomainError> => {
      return validateFile(file).andThen((validatedFile) => {
        const extension = getExtension(validatedFile.type);
        const timestamp = Date.now();
        const key = `${path}/${timestamp}.${extension}`;

        return ResultAsync.fromPromise(
          validatedFile.arrayBuffer().then((buffer) =>
            bucket.put(key, buffer, {
              httpMetadata: {
                contentType: validatedFile.type,
              },
            })
          ),
          (error) => {
            console.error("[ImageStorage.upload]", error);
            return DomainErrors.database("画像のアップロードに失敗しました");
          }
        ).map(() => ({
          url: `${publicUrl}/${key}`,
          key,
        }));
      });
    },

    /**
     * Deletes an image from R2.
     *
     * @param key - The key of the image to delete
     * @returns void or database error
     */
    delete: (key: string): ResultAsync<void, DomainError> => {
      return ResultAsync.fromPromise(bucket.delete(key), (error) => {
        console.error("[ImageStorage.delete]", error);
        return DomainErrors.database("画像の削除に失敗しました");
      });
    },
  };
};

/**
 * Exported constants for testing
 */
export const IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} as const;
