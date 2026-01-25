import { describe, it, expect } from "vitest";
import {
  // Cat schemas
  createCatSchema,
  updateCatSchema,
  type CreateCatInput,
  type UpdateCatInput,
  // Toilet log schemas
  toiletTypeSchema,
  createLogSchema,
  updateLogSchema,
  logsQuerySchema,
  type ToiletType,
  type CreateLogInput,
  type UpdateLogInput,
  type LogsQuery,
  // Stats schemas
  periodSchema,
  statsQuerySchema,
  type Period,
  type StatsQuery,
} from "./schemas";

describe("Cat Schemas", () => {
  describe("createCatSchema", () => {
    it("should validate a valid cat with only name", () => {
      const input = { name: "みけ" };
      const result = createCatSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("みけ");
      }
    });

    it("should validate a cat with all fields", () => {
      const input = {
        name: "みけ",
        birthDate: "2020-01-15T00:00:00.000Z",
        breed: "三毛猫",
        weight: 4.5,
      };
      const result = createCatSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should reject empty name", () => {
      const input = { name: "" };
      const result = createCatSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 50 characters", () => {
      const input = { name: "a".repeat(51) };
      const result = createCatSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative weight", () => {
      const input = { name: "みけ", weight: -1 };
      const result = createCatSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject zero weight", () => {
      const input = { name: "みけ", weight: 0 };
      const result = createCatSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid datetime format for birthDate", () => {
      const input = { name: "みけ", birthDate: "2020-01-15" };
      const result = createCatSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("updateCatSchema", () => {
    it("should allow partial updates", () => {
      const input = { name: "たま" };
      const result = updateCatSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should allow empty object", () => {
      const input = {};
      const result = updateCatSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should still validate field constraints", () => {
      const input = { weight: -1 };
      const result = updateCatSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

describe("Toilet Log Schemas", () => {
  describe("toiletTypeSchema", () => {
    it("should accept 'urine'", () => {
      const result = toiletTypeSchema.safeParse("urine");
      expect(result.success).toBe(true);
    });

    it("should accept 'feces'", () => {
      const result = toiletTypeSchema.safeParse("feces");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = toiletTypeSchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });
  });

  describe("createLogSchema", () => {
    it("should validate a valid log with required fields", () => {
      const input = {
        catId: "550e8400-e29b-41d4-a716-446655440000",
        type: "urine",
      };
      const result = createLogSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate a log with all fields", () => {
      const input = {
        catId: "550e8400-e29b-41d4-a716-446655440000",
        type: "feces",
        timestamp: "2024-01-15T10:30:00.000Z",
        note: "正常な排便",
      };
      const result = createLogSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID for catId", () => {
      const input = {
        catId: "invalid-uuid",
        type: "urine",
      };
      const result = createLogSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject note longer than 500 characters", () => {
      const input = {
        catId: "550e8400-e29b-41d4-a716-446655440000",
        type: "urine",
        note: "a".repeat(501),
      };
      const result = createLogSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("updateLogSchema", () => {
    it("should allow partial updates", () => {
      const input = { note: "更新されたメモ" };
      const result = updateLogSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should allow empty object", () => {
      const input = {};
      const result = updateLogSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("logsQuerySchema", () => {
    it("should provide defaults for page and limit", () => {
      const input = {};
      const result = logsQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept all filter options", () => {
      const input = {
        catId: "550e8400-e29b-41d4-a716-446655440000",
        type: "urine",
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-01-31T23:59:59.999Z",
        page: 2,
        limit: 50,
      };
      const result = logsQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should coerce string numbers for page and limit", () => {
      const input = { page: "3", limit: "25" };
      const result = logsQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
      }
    });

    it("should reject limit greater than 100", () => {
      const input = { limit: 101 };
      const result = logsQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-positive page", () => {
      const input = { page: 0 };
      const result = logsQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

describe("Stats Schemas", () => {
  describe("periodSchema", () => {
    it("should accept 'today'", () => {
      const result = periodSchema.safeParse("today");
      expect(result.success).toBe(true);
    });

    it("should accept 'week'", () => {
      const result = periodSchema.safeParse("week");
      expect(result.success).toBe(true);
    });

    it("should accept 'month'", () => {
      const result = periodSchema.safeParse("month");
      expect(result.success).toBe(true);
    });

    it("should reject invalid period", () => {
      const result = periodSchema.safeParse("year");
      expect(result.success).toBe(false);
    });
  });

  describe("statsQuerySchema", () => {
    it("should accept empty query", () => {
      const input = {};
      const result = statsQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept all options", () => {
      const input = {
        catId: "550e8400-e29b-41d4-a716-446655440000",
        period: "week",
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-01-31T23:59:59.999Z",
      };
      const result = statsQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});

describe("Type exports", () => {
  it("should export CreateCatInput type", () => {
    const cat: CreateCatInput = { name: "みけ" };
    expect(cat.name).toBe("みけ");
  });

  it("should export ToiletType type", () => {
    const type: ToiletType = "urine";
    expect(type).toBe("urine");
  });

  it("should export Period type", () => {
    const period: Period = "today";
    expect(period).toBe("today");
  });
});
