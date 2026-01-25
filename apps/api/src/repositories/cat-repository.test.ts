import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCatRepository } from "./cat-repository";
import type { Cat, NewCat } from "../db/schema";

// Mock drizzle-orm with separate mocks for different query chains
const mockReturning = vi.fn();
const mockSelectWhere = vi.fn();
const mockMutationWhere = vi.fn(() => ({ returning: mockReturning }));
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockMutationWhere }));
const mockFrom = vi.fn(() => ({ where: mockSelectWhere }));

const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));
const mockDelete = vi.fn(() => ({ where: mockMutationWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    select: mockSelect,
  })),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn((a, b) => ({ type: "eq", a, b })),
    and: vi.fn((...args) => ({ type: "and", args })),
  };
});

describe("CatRepository", () => {
  const mockDb = {} as D1Database;
  let repository: ReturnType<typeof createCatRepository>;

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

  beforeEach(() => {
    vi.clearAllMocks();
    repository = createCatRepository(mockDb);
  });

  describe("create", () => {
    it("should create a cat and return it", async () => {
      mockReturning.mockResolvedValueOnce([mockCat]);

      const newCat: NewCat = {
        id: "cat_123",
        userId: "user_456",
        name: "みけ",
        birthDate: "2020-01-01",
        breed: "三毛猫",
        weight: 4.5,
      };

      const result = await repository.create(newCat);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("cat_123");
        expect(result.value.name).toBe("みけ");
      }
    });

    it("should return database error on failure", async () => {
      mockReturning.mockRejectedValueOnce(new Error("DB error"));

      const newCat: NewCat = {
        id: "cat_123",
        userId: "user_456",
        name: "みけ",
      };

      const result = await repository.create(newCat);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("update", () => {
    it("should update a cat and return it", async () => {
      const updatedCat = { ...mockCat, name: "たま" };
      mockReturning.mockResolvedValueOnce([updatedCat]);

      const result = await repository.update("cat_123", "user_456", {
        name: "たま",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("たま");
      }
    });

    it("should return not_found error when cat does not exist", async () => {
      mockReturning.mockResolvedValueOnce([]);

      const result = await repository.update("cat_123", "user_456", {
        name: "たま",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
        if (result.error.type === "not_found") {
          expect(result.error.resource).toBe("cat");
          expect(result.error.id).toBe("cat_123");
        }
      }
    });

    it("should return database error on failure", async () => {
      mockReturning.mockRejectedValueOnce(new Error("DB error"));

      const result = await repository.update("cat_123", "user_456", {
        name: "たま",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("delete", () => {
    it("should delete a cat successfully", async () => {
      mockReturning.mockResolvedValueOnce([{ id: "cat_123" }]);

      const result = await repository.delete("cat_123", "user_456");

      expect(result.isOk()).toBe(true);
    });

    it("should return not_found error when cat does not exist", async () => {
      mockReturning.mockResolvedValueOnce([]);

      const result = await repository.delete("cat_123", "user_456");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
      }
    });

    it("should return database error on failure", async () => {
      mockReturning.mockRejectedValueOnce(new Error("DB error"));

      const result = await repository.delete("cat_123", "user_456");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("findById", () => {
    it("should return a cat when found", async () => {
      mockSelectWhere.mockResolvedValueOnce([mockCat]);

      const result = await repository.findById("cat_123", "user_456");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockCat);
      }
    });

    it("should return null when cat is not found", async () => {
      mockSelectWhere.mockResolvedValueOnce([]);

      const result = await repository.findById("cat_123", "user_456");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    it("should return database error on failure", async () => {
      mockSelectWhere.mockRejectedValueOnce(new Error("DB error"));

      const result = await repository.findById("cat_123", "user_456");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("findAllByUserId", () => {
    it("should return all cats for a user", async () => {
      const cats = [mockCat, { ...mockCat, id: "cat_456", name: "たま" }];
      mockSelectWhere.mockResolvedValueOnce(cats);

      const result = await repository.findAllByUserId("user_456");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]!.name).toBe("みけ");
        expect(result.value[1]!.name).toBe("たま");
      }
    });

    it("should return empty array when user has no cats", async () => {
      mockSelectWhere.mockResolvedValueOnce([]);

      const result = await repository.findAllByUserId("user_456");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });

    it("should return database error on failure", async () => {
      mockSelectWhere.mockRejectedValueOnce(new Error("DB error"));

      const result = await repository.findAllByUserId("user_456");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });
});
