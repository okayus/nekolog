import { describe, it, expect, vi, beforeEach } from "vitest";
import { okAsync, errAsync } from "neverthrow";
import { DomainErrors } from "@nekolog/shared";
import { addLog, updateLog, deleteLog, getLog, getHistory } from "./log-workflows";
import type { CatRepository } from "../repositories/cat-repository";
import type { LogRepository } from "../repositories/log-repository";
import type { Cat, ToiletLog } from "../db/schema";

// Use valid UUID for generated IDs
const generatedUuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => generatedUuid),
});

describe("Log Workflows", () => {
  // Valid UUID format (version 4, variant 8-b)
  const catId = "11111111-1111-4111-8111-111111111111";
  const logId = "22222222-2222-4222-8222-222222222222";
  const userId = "user_456";

  const mockCat: Cat = {
    id: catId,
    userId,
    name: "みけ",
    birthDate: "2020-01-01T00:00:00.000Z",
    breed: "三毛猫",
    weight: 4.5,
    imageUrl: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const mockLog: ToiletLog = {
    id: logId,
    catId,
    type: "urine",
    timestamp: "2024-01-01T10:00:00.000Z",
    note: "正常",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T10:00:00.000Z",
  };

  let mockCatRepo: CatRepository;
  let mockLogRepo: LogRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCatRepo = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findAllByUserId: vi.fn(),
    };
    mockLogRepo = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findWithFilters: vi.fn(),
      aggregateByCat: vi.fn(),
      aggregateByPeriod: vi.fn(),
    };
  });

  describe("addLog", () => {
    it("should create a log with valid input", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(mockCat));
      vi.mocked(mockLogRepo.create).mockReturnValue(okAsync(mockLog));

      const input = {
        catId,
        type: "urine",
        timestamp: "2024-01-01T10:00:00.000Z",
        note: "正常",
      };

      const result = await addLog(input, userId, mockCatRepo, mockLogRepo);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("urine");
        expect(result.value.note).toBe("正常");
      }
      expect(mockCatRepo.findById).toHaveBeenCalledWith(catId, userId);
      expect(mockLogRepo.create).toHaveBeenCalledWith({
        id: generatedUuid,
        catId,
        type: "urine",
        timestamp: "2024-01-01T10:00:00.000Z",
        note: "正常",
      });
    });

    it("should create a log with minimal input", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(mockCat));
      vi.mocked(mockLogRepo.create).mockReturnValue(okAsync(mockLog));

      const input = {
        catId,
        type: "feces",
      };

      const result = await addLog(input, userId, mockCatRepo, mockLogRepo);

      expect(result.isOk()).toBe(true);
      expect(mockLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: generatedUuid,
          catId,
          type: "feces",
          note: null,
        })
      );
    });

    it("should use current timestamp when not provided", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(mockCat));
      vi.mocked(mockLogRepo.create).mockReturnValue(okAsync(mockLog));

      const input = {
        catId,
        type: "urine",
      };

      await addLog(input, userId, mockCatRepo, mockLogRepo);

      expect(mockLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });

    it("should return validation error for missing catId", async () => {
      const input = {
        type: "urine",
      };

      const result = await addLog(input, userId, mockCatRepo, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
      }
      expect(mockCatRepo.findById).not.toHaveBeenCalled();
      expect(mockLogRepo.create).not.toHaveBeenCalled();
    });

    it("should return validation error for invalid type", async () => {
      const input = {
        catId,
        type: "invalid",
      };

      const result = await addLog(input, userId, mockCatRepo, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
      }
    });

    it("should return validation error for invalid catId format", async () => {
      const input = {
        catId: "invalid-uuid",
        type: "urine",
      };

      const result = await addLog(input, userId, mockCatRepo, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
        if (result.error.type === "validation") {
          expect(result.error.field).toBe("catId");
        }
      }
    });

    it("should return not_found error when cat does not exist", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(null));

      const input = {
        catId,
        type: "urine",
      };

      const result = await addLog(input, userId, mockCatRepo, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
        if (result.error.type === "not_found") {
          expect(result.error.resource).toBe("cat");
        }
      }
      expect(mockLogRepo.create).not.toHaveBeenCalled();
    });

    it("should propagate database error from catRepo", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const input = {
        catId,
        type: "urine",
      };

      const result = await addLog(input, userId, mockCatRepo, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });

    it("should propagate database error from logRepo", async () => {
      vi.mocked(mockCatRepo.findById).mockReturnValue(okAsync(mockCat));
      vi.mocked(mockLogRepo.create).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const input = {
        catId,
        type: "urine",
      };

      const result = await addLog(input, userId, mockCatRepo, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("updateLog", () => {
    it("should update a log with valid input", async () => {
      const updatedLog = { ...mockLog, note: "異常なし" };
      vi.mocked(mockLogRepo.update).mockReturnValue(okAsync(updatedLog));

      const input = { note: "異常なし" };

      const result = await updateLog(logId, input, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.note).toBe("異常なし");
      }
      expect(mockLogRepo.update).toHaveBeenCalledWith(logId, userId, {
        note: "異常なし",
      });
    });

    it("should update type field", async () => {
      const updatedLog = { ...mockLog, type: "feces" as const };
      vi.mocked(mockLogRepo.update).mockReturnValue(okAsync(updatedLog));

      const input = { type: "feces" };

      const result = await updateLog(logId, input, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      expect(mockLogRepo.update).toHaveBeenCalledWith(logId, userId, {
        type: "feces",
      });
    });

    it("should update timestamp field", async () => {
      const newTimestamp = "2024-01-02T15:00:00.000Z";
      const updatedLog = { ...mockLog, timestamp: newTimestamp };
      vi.mocked(mockLogRepo.update).mockReturnValue(okAsync(updatedLog));

      const input = { timestamp: newTimestamp };

      const result = await updateLog(logId, input, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      expect(mockLogRepo.update).toHaveBeenCalledWith(logId, userId, {
        timestamp: newTimestamp,
      });
    });

    it("should update multiple fields", async () => {
      const updatedLog = { ...mockLog, type: "feces" as const, note: "軟便" };
      vi.mocked(mockLogRepo.update).mockReturnValue(okAsync(updatedLog));

      const input = { type: "feces", note: "軟便" };

      const result = await updateLog(logId, input, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      expect(mockLogRepo.update).toHaveBeenCalledWith(logId, userId, {
        type: "feces",
        note: "軟便",
      });
    });

    it("should return validation error for invalid type", async () => {
      const input = { type: "invalid" };

      const result = await updateLog(logId, input, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
      }
      expect(mockLogRepo.update).not.toHaveBeenCalled();
    });

    it("should return not_found error when log does not exist", async () => {
      vi.mocked(mockLogRepo.update).mockReturnValue(
        errAsync(DomainErrors.notFound("toilet_log", logId))
      );

      const input = { note: "更新" };

      const result = await updateLog(logId, input, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
      }
    });

    it("should propagate database error", async () => {
      vi.mocked(mockLogRepo.update).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const input = { note: "更新" };

      const result = await updateLog(logId, input, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("deleteLog", () => {
    it("should delete a log when confirmed", async () => {
      vi.mocked(mockLogRepo.delete).mockReturnValue(okAsync(undefined));

      const result = await deleteLog(logId, true, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      expect(mockLogRepo.delete).toHaveBeenCalledWith(logId, userId);
    });

    it("should return confirmation_required error when not confirmed", async () => {
      const result = await deleteLog(logId, false, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("confirmation_required");
      }
      expect(mockLogRepo.delete).not.toHaveBeenCalled();
    });

    it("should return not_found error when log does not exist", async () => {
      vi.mocked(mockLogRepo.delete).mockReturnValue(
        errAsync(DomainErrors.notFound("toilet_log", logId))
      );

      const result = await deleteLog(logId, true, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
      }
    });

    it("should propagate database error", async () => {
      vi.mocked(mockLogRepo.delete).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const result = await deleteLog(logId, true, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("getLog", () => {
    it("should return a log when found", async () => {
      vi.mocked(mockLogRepo.findById).mockReturnValue(okAsync(mockLog));

      const result = await getLog(logId, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(logId);
        expect(result.value.type).toBe("urine");
      }
    });

    it("should return not_found error when log is not found", async () => {
      vi.mocked(mockLogRepo.findById).mockReturnValue(okAsync(null));

      const result = await getLog(logId, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("not_found");
        if (result.error.type === "not_found") {
          expect(result.error.resource).toBe("toilet_log");
          expect(result.error.id).toBe(logId);
        }
      }
    });

    it("should propagate database error", async () => {
      vi.mocked(mockLogRepo.findById).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const result = await getLog(logId, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });

  describe("getHistory", () => {
    const paginatedResult = {
      logs: [mockLog],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    it("should return paginated logs with default query", async () => {
      vi.mocked(mockLogRepo.findWithFilters).mockReturnValue(
        okAsync(paginatedResult)
      );

      const query = {};

      const result = await getHistory(query, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.logs).toHaveLength(1);
        expect(result.value.total).toBe(1);
        expect(result.value.page).toBe(1);
        expect(result.value.limit).toBe(20);
      }
      expect(mockLogRepo.findWithFilters).toHaveBeenCalledWith(userId, {
        page: 1,
        limit: 20,
      });
    });

    it("should pass catId filter", async () => {
      vi.mocked(mockLogRepo.findWithFilters).mockReturnValue(
        okAsync(paginatedResult)
      );

      const query = { catId };

      const result = await getHistory(query, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      expect(mockLogRepo.findWithFilters).toHaveBeenCalledWith(userId, {
        catId,
        page: 1,
        limit: 20,
      });
    });

    it("should pass type filter", async () => {
      vi.mocked(mockLogRepo.findWithFilters).mockReturnValue(
        okAsync(paginatedResult)
      );

      const query = { type: "urine" };

      const result = await getHistory(query, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      expect(mockLogRepo.findWithFilters).toHaveBeenCalledWith(userId, {
        type: "urine",
        page: 1,
        limit: 20,
      });
    });

    it("should pass date range filter", async () => {
      vi.mocked(mockLogRepo.findWithFilters).mockReturnValue(
        okAsync(paginatedResult)
      );

      const query = {
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-01-31T23:59:59.999Z",
      };

      const result = await getHistory(query, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      expect(mockLogRepo.findWithFilters).toHaveBeenCalledWith(userId, {
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-01-31T23:59:59.999Z",
        page: 1,
        limit: 20,
      });
    });

    it("should pass pagination parameters", async () => {
      vi.mocked(mockLogRepo.findWithFilters).mockReturnValue(
        okAsync({ ...paginatedResult, page: 2, limit: 50 })
      );

      const query = { page: 2, limit: 50 };

      const result = await getHistory(query, userId, mockLogRepo);

      expect(result.isOk()).toBe(true);
      expect(mockLogRepo.findWithFilters).toHaveBeenCalledWith(userId, {
        page: 2,
        limit: 50,
      });
    });

    it("should return validation error for invalid type filter", async () => {
      const query = { type: "invalid" };

      const result = await getHistory(query, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
      }
      expect(mockLogRepo.findWithFilters).not.toHaveBeenCalled();
    });

    it("should return validation error for invalid catId format", async () => {
      const query = { catId: "invalid-uuid" };

      const result = await getHistory(query, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
      }
    });

    it("should return validation error for invalid page", async () => {
      const query = { page: 0 };

      const result = await getHistory(query, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
      }
    });

    it("should return validation error for limit exceeding max", async () => {
      const query = { limit: 101 };

      const result = await getHistory(query, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("validation");
      }
    });

    it("should propagate database error", async () => {
      vi.mocked(mockLogRepo.findWithFilters).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const query = {};

      const result = await getHistory(query, userId, mockLogRepo);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("database");
      }
    });
  });
});
