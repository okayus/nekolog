import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLogRepository } from "./log-repository";
import type { ToiletLog, NewToiletLog } from "../db/schema";

// Mock drizzle-orm with separate mocks for different query chains
const mockReturning = vi.fn();
const mockMutationWhere = vi.fn(() => ({ returning: mockReturning }));
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockMutationWhere }));
const mockOffset = vi.fn();
const mockLimit = vi.fn(() => ({ offset: mockOffset }));
const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockJoinedWhere = vi.fn<any>(() => ({ orderBy: mockOrderBy }));
const mockInnerJoin = vi.fn(() => ({ where: mockJoinedWhere }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockDeleteWhere = vi.fn();

const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));
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
    gte: vi.fn((a, b) => ({ type: "gte", a, b })),
    lte: vi.fn((a, b) => ({ type: "lte", a, b })),
    desc: vi.fn((a) => ({ type: "desc", a })),
  };
});

describe("LogRepository", () => {
  const mockDb = {} as D1Database;
  let repository: ReturnType<typeof createLogRepository>;

  const mockLog: ToiletLog = {
    id: "log_123",
    catId: "cat_456",
    type: "urine",
    timestamp: "2024-01-01T10:00:00.000Z",
    note: "正常",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T10:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = createLogRepository(mockDb);
  });

  describe("create", () => {
    it("should create a log and return it", async () => {
      mockReturning.mockResolvedValueOnce([mockLog]);

      const newLog: NewToiletLog = {
        id: "log_123",
        catId: "cat_456",
        type: "urine",
        timestamp: "2024-01-01T10:00:00.000Z",
        note: "正常",
      };

      const result = await repository.create(newLog);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("log_123");
        expect(result.value.type).toBe("urine");
      }
    });

    it("should return database error on failure", async () => {
      mockReturning.mockRejectedValueOnce(new Error("DB error"));

      const newLog: NewToiletLog = {
        id: "log_123",
        catId: "cat_456",
        type: "urine",
        timestamp: "2024-01-01T10:00:00.000Z",
      };

      const result = await repository.create(newLog);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("update", () => {
    it("should update a log and return it", async () => {
      // Mock findLogWithOwnership
      mockJoinedWhere.mockResolvedValueOnce([{ log: mockLog }]);
      // Mock update
      const updatedLog = { ...mockLog, note: "異常なし" };
      mockReturning.mockResolvedValueOnce([updatedLog]);

      const result = await repository.update("log_123", "user_789", {
        note: "異常なし",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.note).toBe("異常なし");
      }
    });

    it("should return not_found error when log does not exist", async () => {
      // Mock findLogWithOwnership returns empty
      mockJoinedWhere.mockResolvedValueOnce([]);

      const result = await repository.update("log_123", "user_789", {
        note: "異常なし",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
        if (result.error.type === "not_found") {
          expect(result.error.resource).toBe("toilet_log");
          expect(result.error.id).toBe("log_123");
        }
      }
    });

    it("should return database error on failure", async () => {
      mockJoinedWhere.mockRejectedValueOnce(new Error("DB error"));

      const result = await repository.update("log_123", "user_789", {
        note: "異常なし",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("delete", () => {
    it("should delete a log successfully", async () => {
      // Mock findLogWithOwnership
      mockJoinedWhere.mockResolvedValueOnce([{ log: mockLog }]);
      // Mock delete
      mockDeleteWhere.mockResolvedValueOnce(undefined);

      const result = await repository.delete("log_123", "user_789");

      expect(result.isOk()).toBe(true);
    });

    it("should return not_found error when log does not exist", async () => {
      // Mock findLogWithOwnership returns empty
      mockJoinedWhere.mockResolvedValueOnce([]);

      const result = await repository.delete("log_123", "user_789");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
      }
    });

    it("should return database error on failure", async () => {
      mockJoinedWhere.mockRejectedValueOnce(new Error("DB error"));

      const result = await repository.delete("log_123", "user_789");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("findById", () => {
    it("should return a log when found", async () => {
      mockJoinedWhere.mockResolvedValueOnce([{ log: mockLog }]);

      const result = await repository.findById("log_123", "user_789");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockLog);
      }
    });

    it("should return null when log is not found", async () => {
      mockJoinedWhere.mockResolvedValueOnce([]);

      const result = await repository.findById("log_123", "user_789");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    it("should return database error on failure", async () => {
      mockJoinedWhere.mockRejectedValueOnce(new Error("DB error"));

      const result = await repository.findById("log_123", "user_789");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("findWithFilters", () => {
    it("should return paginated logs", async () => {
      const logs = [mockLog, { ...mockLog, id: "log_456" }];
      // Mock count query
      mockJoinedWhere.mockResolvedValueOnce([{ count: 2 }]);
      // Mock logs query
      mockOffset.mockResolvedValueOnce(logs);

      const result = await repository.findWithFilters("user_789", {
        page: 1,
        limit: 20,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.logs).toHaveLength(2);
        expect(result.value.total).toBe(2);
        expect(result.value.page).toBe(1);
        expect(result.value.limit).toBe(20);
        expect(result.value.totalPages).toBe(1);
      }
    });

    it("should return empty array when no logs found", async () => {
      // Mock count query
      mockJoinedWhere.mockResolvedValueOnce([{ count: 0 }]);
      // Mock logs query
      mockOffset.mockResolvedValueOnce([]);

      const result = await repository.findWithFilters("user_789", {
        page: 1,
        limit: 20,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.logs).toEqual([]);
        expect(result.value.total).toBe(0);
        expect(result.value.totalPages).toBe(0);
      }
    });

    it("should calculate totalPages correctly", async () => {
      // Mock count query
      mockJoinedWhere.mockResolvedValueOnce([{ count: 45 }]);
      // Mock logs query
      mockOffset.mockResolvedValueOnce([mockLog]);

      const result = await repository.findWithFilters("user_789", {
        page: 1,
        limit: 20,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.total).toBe(45);
        expect(result.value.totalPages).toBe(3);
      }
    });

    it("should apply catId filter", async () => {
      mockJoinedWhere.mockResolvedValueOnce([{ count: 1 }]);
      mockOffset.mockResolvedValueOnce([mockLog]);

      const result = await repository.findWithFilters("user_789", {
        catId: "cat_456",
        page: 1,
        limit: 20,
      });

      expect(result.isOk()).toBe(true);
    });

    it("should apply type filter", async () => {
      mockJoinedWhere.mockResolvedValueOnce([{ count: 1 }]);
      mockOffset.mockResolvedValueOnce([mockLog]);

      const result = await repository.findWithFilters("user_789", {
        type: "urine",
        page: 1,
        limit: 20,
      });

      expect(result.isOk()).toBe(true);
    });

    it("should apply date range filter", async () => {
      mockJoinedWhere.mockResolvedValueOnce([{ count: 1 }]);
      mockOffset.mockResolvedValueOnce([mockLog]);

      const result = await repository.findWithFilters("user_789", {
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-01-31T23:59:59.999Z",
        page: 1,
        limit: 20,
      });

      expect(result.isOk()).toBe(true);
    });

    it("should return database error on failure", async () => {
      mockJoinedWhere.mockRejectedValueOnce(new Error("DB error"));

      const result = await repository.findWithFilters("user_789", {
        page: 1,
        limit: 20,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });
});
