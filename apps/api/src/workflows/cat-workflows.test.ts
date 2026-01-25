import { describe, it, expect, vi, beforeEach } from "vitest";
import { okAsync, errAsync } from "neverthrow";
import { DomainErrors } from "@nekolog/shared";
import {
  registerCat,
  updateCat,
  deleteCat,
  getCat,
  listCats,
} from "./cat-workflows";
import type { CatRepository } from "../repositories/cat-repository";
import type { Cat } from "../db/schema";

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "generated-uuid-123"),
});

describe("Cat Workflows", () => {
  const mockCat: Cat = {
    id: "cat_123",
    userId: "user_456",
    name: "みけ",
    birthDate: "2020-01-01T00:00:00.000Z",
    breed: "三毛猫",
    weight: 4.5,
    imageUrl: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  let mockRepo: CatRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findAllByUserId: vi.fn(),
    };
  });

  describe("registerCat", () => {
    it("should create a cat with valid input", async () => {
      vi.mocked(mockRepo.create).mockReturnValue(okAsync(mockCat));

      const input = {
        name: "みけ",
        birthDate: "2020-01-01T00:00:00.000Z",
        breed: "三毛猫",
        weight: 4.5,
      };

      const result = await registerCat(input, "user_456", mockRepo);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("みけ");
      }
      expect(mockRepo.create).toHaveBeenCalledWith({
        id: "generated-uuid-123",
        userId: "user_456",
        name: "みけ",
        birthDate: "2020-01-01T00:00:00.000Z",
        breed: "三毛猫",
        weight: 4.5,
      });
    });

    it("should create a cat with minimal input", async () => {
      vi.mocked(mockRepo.create).mockReturnValue(okAsync(mockCat));

      const input = { name: "たま" };

      const result = await registerCat(input, "user_456", mockRepo);

      expect(result.isOk()).toBe(true);
      expect(mockRepo.create).toHaveBeenCalledWith({
        id: "generated-uuid-123",
        userId: "user_456",
        name: "たま",
        birthDate: null,
        breed: null,
        weight: null,
      });
    });

    it("should return validation error for empty name", async () => {
      const input = { name: "" };

      const result = await registerCat(input, "user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
        if (result.error.type === "validation") {
          expect(result.error.field).toBe("name");
        }
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should return validation error for missing name", async () => {
      const input = { breed: "三毛猫" };

      const result = await registerCat(input, "user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should return validation error for invalid weight", async () => {
      const input = { name: "みけ", weight: -1 };

      const result = await registerCat(input, "user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
        if (result.error.type === "validation") {
          expect(result.error.field).toBe("weight");
        }
      }
    });

    it("should propagate database error", async () => {
      vi.mocked(mockRepo.create).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const input = { name: "みけ" };

      const result = await registerCat(input, "user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("updateCat", () => {
    it("should update a cat with valid input", async () => {
      const updatedCat = { ...mockCat, name: "たま" };
      vi.mocked(mockRepo.update).mockReturnValue(okAsync(updatedCat));

      const input = { name: "たま" };

      const result = await updateCat("cat_123", input, "user_456", mockRepo);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("たま");
      }
      expect(mockRepo.update).toHaveBeenCalledWith("cat_123", "user_456", {
        name: "たま",
      });
    });

    it("should update multiple fields", async () => {
      const updatedCat = { ...mockCat, name: "たま", weight: 5.0 };
      vi.mocked(mockRepo.update).mockReturnValue(okAsync(updatedCat));

      const input = { name: "たま", weight: 5.0 };

      const result = await updateCat("cat_123", input, "user_456", mockRepo);

      expect(result.isOk()).toBe(true);
      expect(mockRepo.update).toHaveBeenCalledWith("cat_123", "user_456", {
        name: "たま",
        weight: 5.0,
      });
    });

    it("should return validation error for invalid weight", async () => {
      const input = { weight: -1 };

      const result = await updateCat("cat_123", input, "user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return not_found error when cat does not exist", async () => {
      vi.mocked(mockRepo.update).mockReturnValue(
        errAsync(DomainErrors.notFound("cat", "cat_123"))
      );

      const input = { name: "たま" };

      const result = await updateCat("cat_123", input, "user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
      }
    });
  });

  describe("deleteCat", () => {
    it("should delete a cat when confirmed", async () => {
      vi.mocked(mockRepo.delete).mockReturnValue(okAsync(undefined));

      const result = await deleteCat("cat_123", true, "user_456", mockRepo);

      expect(result.isOk()).toBe(true);
      expect(mockRepo.delete).toHaveBeenCalledWith("cat_123", "user_456");
    });

    it("should return confirmation_required error when not confirmed", async () => {
      const result = await deleteCat("cat_123", false, "user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("confirmation_required");
      }
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("should return not_found error when cat does not exist", async () => {
      vi.mocked(mockRepo.delete).mockReturnValue(
        errAsync(DomainErrors.notFound("cat", "cat_123"))
      );

      const result = await deleteCat("cat_123", true, "user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
      }
    });
  });

  describe("getCat", () => {
    it("should return a cat when found", async () => {
      vi.mocked(mockRepo.findById).mockReturnValue(okAsync(mockCat));

      const result = await getCat("cat_123", "user_456", mockRepo);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("cat_123");
        expect(result.value.name).toBe("みけ");
      }
    });

    it("should return not_found error when cat is not found", async () => {
      vi.mocked(mockRepo.findById).mockReturnValue(okAsync(null));

      const result = await getCat("cat_123", "user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
        if (result.error.type === "not_found") {
          expect(result.error.resource).toBe("cat");
          expect(result.error.id).toBe("cat_123");
        }
      }
    });

    it("should propagate database error", async () => {
      vi.mocked(mockRepo.findById).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const result = await getCat("cat_123", "user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("listCats", () => {
    it("should return all cats for a user", async () => {
      const cats = [mockCat, { ...mockCat, id: "cat_456", name: "たま" }];
      vi.mocked(mockRepo.findAllByUserId).mockReturnValue(okAsync(cats));

      const result = await listCats("user_456", mockRepo);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]!.name).toBe("みけ");
        expect(result.value[1]!.name).toBe("たま");
      }
    });

    it("should return empty array when user has no cats", async () => {
      vi.mocked(mockRepo.findAllByUserId).mockReturnValue(okAsync([]));

      const result = await listCats("user_456", mockRepo);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });

    it("should propagate database error", async () => {
      vi.mocked(mockRepo.findAllByUserId).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const result = await listCats("user_456", mockRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });
});
