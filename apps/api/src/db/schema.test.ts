import { describe, it, expect } from "vitest";
import { getTableName } from "drizzle-orm";
import {
  users,
  cats,
  toiletLogs,
  type User,
  type NewUser,
  type Cat,
  type NewCat,
  type ToiletLog,
  type NewToiletLog,
} from "./schema";

describe("Database Schema", () => {
  describe("users table", () => {
    it("should have correct table name", () => {
      expect(getTableName(users)).toBe("users");
    });

    it("should have required columns", () => {
      expect(users.id).toBeDefined();
      expect(users.clerkId).toBeDefined();
      expect(users.email).toBeDefined();
      expect(users.createdAt).toBeDefined();
    });
  });

  describe("cats table", () => {
    it("should have correct table name", () => {
      expect(getTableName(cats)).toBe("cats");
    });

    it("should have required columns", () => {
      expect(cats.id).toBeDefined();
      expect(cats.userId).toBeDefined();
      expect(cats.name).toBeDefined();
      expect(cats.birthDate).toBeDefined();
      expect(cats.breed).toBeDefined();
      expect(cats.weight).toBeDefined();
      expect(cats.imageUrl).toBeDefined();
      expect(cats.createdAt).toBeDefined();
      expect(cats.updatedAt).toBeDefined();
    });
  });

  describe("toiletLogs table", () => {
    it("should have correct table name", () => {
      expect(getTableName(toiletLogs)).toBe("toilet_logs");
    });

    it("should have required columns", () => {
      expect(toiletLogs.id).toBeDefined();
      expect(toiletLogs.catId).toBeDefined();
      expect(toiletLogs.type).toBeDefined();
      expect(toiletLogs.timestamp).toBeDefined();
      expect(toiletLogs.note).toBeDefined();
      expect(toiletLogs.createdAt).toBeDefined();
      expect(toiletLogs.updatedAt).toBeDefined();
    });
  });

  describe("Type exports", () => {
    it("should export User types", () => {
      // Type check only - this verifies the types are correctly exported
      const user: User = {
        id: "1",
        clerkId: "clerk_123",
        email: "test@example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
      };
      expect(user.id).toBe("1");
    });

    it("should export Cat types", () => {
      const cat: Cat = {
        id: "1",
        userId: "1",
        name: "みけ",
        birthDate: null,
        breed: null,
        weight: null,
        imageUrl: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
      expect(cat.name).toBe("みけ");
    });

    it("should export ToiletLog types", () => {
      const log: ToiletLog = {
        id: "1",
        catId: "1",
        type: "urine",
        timestamp: "2024-01-01T10:00:00.000Z",
        note: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
      expect(log.type).toBe("urine");
    });

    it("should allow NewCat without optional fields", () => {
      const newCat: NewCat = {
        id: "1",
        userId: "1",
        name: "たま",
      };
      expect(newCat.name).toBe("たま");
    });

    it("should allow NewToiletLog with required fields", () => {
      const newLog: NewToiletLog = {
        id: "1",
        catId: "1",
        type: "feces",
        timestamp: "2024-01-01T10:00:00.000Z",
      };
      expect(newLog.type).toBe("feces");
    });
  });
});
