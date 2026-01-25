import { describe, it, expect, vi, beforeEach } from "vitest";
import { okAsync, errAsync } from "neverthrow";
import { DomainErrors } from "@nekolog/shared";
import { uploadCatImage, deleteCatImage } from "./image-workflows";
import type { CatRepository } from "../repositories/cat-repository";
import type { ImageStorageService } from "../services/image-storage";
import type { Cat } from "../db/schema";

describe("Image Workflows", () => {
  const mockCat: Cat = {
    id: "cat_123",
    userId: "user_456",
    name: "みけ",
    birthDate: "2020-01-01",
    breed: "三毛猫",
    weight: 4.5,
    imageUrl: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  let mockCatRepo: CatRepository;
  let mockImageStorage: ImageStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCatRepo = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findAllByUserId: vi.fn(),
    };
    mockImageStorage = {
      upload: vi.fn(),
      delete: vi.fn(),
    };
  });

  describe("uploadCatImage", () => {
    it("should upload an image and update cat's imageUrl", async () => {
      const uploadResult = {
        url: "https://images.example.com/cats/cat_123/12345.jpg",
        key: "cats/cat_123/12345.jpg",
      };
      const updatedCat = { ...mockCat, imageUrl: uploadResult.url };

      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(mockCat));
      vi.mocked(mockImageStorage.upload).mockReturnValue(okAsync(uploadResult));
      vi.mocked(mockCatRepo.update).mockReturnValue(okAsync(updatedCat));

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const result = await uploadCatImage(
        "cat_123",
        file,
        "user_456",
        mockCatRepo,
        mockImageStorage
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.imageUrl).toBe(uploadResult.url);
      }
      expect(mockCatRepo.findById).toHaveBeenCalledWith("cat_123", "user_456");
      expect(mockImageStorage.upload).toHaveBeenCalledWith(
        file,
        "cats/cat_123"
      );
      expect(mockCatRepo.update).toHaveBeenCalledWith("cat_123", "user_456", {
        imageUrl: uploadResult.url,
      });
    });

    it("should return validation error when file is null", async () => {
      const result = await uploadCatImage(
        "cat_123",
        null,
        "user_456",
        mockCatRepo,
        mockImageStorage
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
        if (result.error.type === "validation") {
          expect(result.error.field).toBe("image");
        }
      }
      expect(mockCatRepo.findById).not.toHaveBeenCalled();
    });

    it("should return not_found error when cat does not exist", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(null));

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const result = await uploadCatImage(
        "cat_123",
        file,
        "user_456",
        mockCatRepo,
        mockImageStorage
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
      }
      expect(mockImageStorage.upload).not.toHaveBeenCalled();
    });

    it("should propagate image storage error", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(mockCat));
      vi.mocked(mockImageStorage.upload).mockReturnValue(
        errAsync(DomainErrors.database("Upload failed"))
      );

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const result = await uploadCatImage(
        "cat_123",
        file,
        "user_456",
        mockCatRepo,
        mockImageStorage
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
      expect(mockCatRepo.update).not.toHaveBeenCalled();
    });

    it("should propagate database error from update", async () => {
      const uploadResult = {
        url: "https://images.example.com/cats/cat_123/12345.jpg",
        key: "cats/cat_123/12345.jpg",
      };

      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(mockCat));
      vi.mocked(mockImageStorage.upload).mockReturnValue(okAsync(uploadResult));
      vi.mocked(mockCatRepo.update).mockReturnValue(
        errAsync(DomainErrors.database("Update failed"))
      );

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const result = await uploadCatImage(
        "cat_123",
        file,
        "user_456",
        mockCatRepo,
        mockImageStorage
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("deleteCatImage", () => {
    it("should delete an image and clear cat's imageUrl", async () => {
      const catWithImage = {
        ...mockCat,
        imageUrl: "https://images.example.com/cats/cat_123/12345.jpg",
      };
      const updatedCat = { ...mockCat, imageUrl: null };

      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(catWithImage));
      vi.mocked(mockImageStorage.delete).mockReturnValue(okAsync(undefined));
      vi.mocked(mockCatRepo.update).mockReturnValue(okAsync(updatedCat));

      const result = await deleteCatImage(
        "cat_123",
        "user_456",
        mockCatRepo,
        mockImageStorage
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.imageUrl).toBeNull();
      }
      expect(mockImageStorage.delete).toHaveBeenCalledWith(
        "cats/cat_123/12345.jpg"
      );
      expect(mockCatRepo.update).toHaveBeenCalledWith("cat_123", "user_456", {
        imageUrl: null,
      });
    });

    it("should handle cat with no image", async () => {
      const catWithoutImage = { ...mockCat, imageUrl: null };

      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(catWithoutImage));
      vi.mocked(mockCatRepo.update).mockReturnValue(okAsync(catWithoutImage));

      const result = await deleteCatImage(
        "cat_123",
        "user_456",
        mockCatRepo,
        mockImageStorage
      );

      expect(result.isOk()).toBe(true);
      expect(mockImageStorage.delete).not.toHaveBeenCalled();
      expect(mockCatRepo.update).toHaveBeenCalledWith("cat_123", "user_456", {
        imageUrl: null,
      });
    });

    it("should return not_found error when cat does not exist", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(null));

      const result = await deleteCatImage(
        "cat_123",
        "user_456",
        mockCatRepo,
        mockImageStorage
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
      }
      expect(mockImageStorage.delete).not.toHaveBeenCalled();
    });

    it("should propagate image storage delete error", async () => {
      const catWithImage = {
        ...mockCat,
        imageUrl: "https://images.example.com/cats/cat_123/12345.jpg",
      };

      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(catWithImage));
      vi.mocked(mockImageStorage.delete).mockReturnValue(
        errAsync(DomainErrors.database("Delete failed"))
      );

      const result = await deleteCatImage(
        "cat_123",
        "user_456",
        mockCatRepo,
        mockImageStorage
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
      expect(mockCatRepo.update).not.toHaveBeenCalled();
    });
  });
});
