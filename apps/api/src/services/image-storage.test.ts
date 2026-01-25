import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createImageStorageService,
  IMAGE_CONSTRAINTS,
} from "./image-storage";

describe("ImageStorageService", () => {
  const mockBucket = {
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as R2Bucket;

  const publicUrl = "https://images.example.com";
  let service: ReturnType<typeof createImageStorageService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createImageStorageService(mockBucket, publicUrl);
  });

  describe("upload", () => {
    it("should upload a valid JPEG image", async () => {
      vi.mocked(mockBucket.put).mockResolvedValueOnce({} as R2Object);

      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });

      const result = await service.upload(file, "cats/cat_123");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.url).toMatch(
          /^https:\/\/images\.example\.com\/cats\/cat_123\/\d+\.jpg$/
        );
        expect(result.value.key).toMatch(/^cats\/cat_123\/\d+\.jpg$/);
      }
      expect(mockBucket.put).toHaveBeenCalledWith(
        expect.stringMatching(/^cats\/cat_123\/\d+\.jpg$/),
        expect.any(ArrayBuffer),
        { httpMetadata: { contentType: "image/jpeg" } }
      );
    });

    it("should upload a valid PNG image", async () => {
      vi.mocked(mockBucket.put).mockResolvedValueOnce({} as R2Object);

      const file = new File(["test content"], "test.png", {
        type: "image/png",
      });

      const result = await service.upload(file, "cats/cat_123");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.url).toMatch(/\.png$/);
      }
    });

    it("should upload a valid GIF image", async () => {
      vi.mocked(mockBucket.put).mockResolvedValueOnce({} as R2Object);

      const file = new File(["test content"], "test.gif", {
        type: "image/gif",
      });

      const result = await service.upload(file, "cats/cat_123");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.url).toMatch(/\.gif$/);
      }
    });

    it("should upload a valid WebP image", async () => {
      vi.mocked(mockBucket.put).mockResolvedValueOnce({} as R2Object);

      const file = new File(["test content"], "test.webp", {
        type: "image/webp",
      });

      const result = await service.upload(file, "cats/cat_123");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.url).toMatch(/\.webp$/);
      }
    });

    it("should return validation error for unsupported file type", async () => {
      const file = new File(["test content"], "test.bmp", {
        type: "image/bmp",
      });

      const result = await service.upload(file, "cats/cat_123");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
        if (result.error.type === "validation") {
          expect(result.error.field).toBe("image");
          expect(result.error.message).toContain("対応していない");
        }
      }
      expect(mockBucket.put).not.toHaveBeenCalled();
    });

    it("should return validation error for file exceeding max size", async () => {
      // Create a file larger than MAX_FILE_SIZE
      const largeContent = new Uint8Array(
        IMAGE_CONSTRAINTS.MAX_FILE_SIZE + 1
      );
      const file = new File([largeContent], "large.jpg", {
        type: "image/jpeg",
      });

      const result = await service.upload(file, "cats/cat_123");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
        if (result.error.type === "validation") {
          expect(result.error.field).toBe("image");
          expect(result.error.message).toContain("5MB");
        }
      }
      expect(mockBucket.put).not.toHaveBeenCalled();
    });

    it("should return database error on R2 upload failure", async () => {
      vi.mocked(mockBucket.put).mockRejectedValueOnce(new Error("R2 error"));

      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });

      const result = await service.upload(file, "cats/cat_123");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("delete", () => {
    it("should delete an image successfully", async () => {
      vi.mocked(mockBucket.delete).mockResolvedValueOnce(undefined);

      const result = await service.delete("cats/cat_123/12345.jpg");

      expect(result.isOk()).toBe(true);
      expect(mockBucket.delete).toHaveBeenCalledWith("cats/cat_123/12345.jpg");
    });

    it("should return database error on R2 delete failure", async () => {
      vi.mocked(mockBucket.delete).mockRejectedValueOnce(new Error("R2 error"));

      const result = await service.delete("cats/cat_123/12345.jpg");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("IMAGE_CONSTRAINTS", () => {
    it("should have correct max file size (5MB)", () => {
      expect(IMAGE_CONSTRAINTS.MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    });

    it("should have correct allowed MIME types", () => {
      expect(IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES).toEqual([
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ]);
    });
  });
});
