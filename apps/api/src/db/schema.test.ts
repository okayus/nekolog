import { describe, it, expect } from "vitest";
import { getTableName } from "drizzle-orm";
import {
  users,
  session,
  account,
  verification,
  cats,
  toiletLogs,
  type User,
  type NewUser,
  type Session,
  type NewSession,
  type Account,
  type NewAccount,
  type Verification,
  type NewVerification,
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
      expect(users.name).toBeDefined();
      expect(users.email).toBeDefined();
      expect(users.emailVerified).toBeDefined();
      expect(users.image).toBeDefined();
      expect(users.createdAt).toBeDefined();
      expect(users.updatedAt).toBeDefined();
    });
  });

  describe("session table", () => {
    it("should have correct table name", () => {
      expect(getTableName(session)).toBe("session");
    });

    it("should have required columns", () => {
      expect(session.id).toBeDefined();
      expect(session.userId).toBeDefined();
      expect(session.token).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      expect(session.ipAddress).toBeDefined();
      expect(session.userAgent).toBeDefined();
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });
  });

  describe("account table", () => {
    it("should have correct table name", () => {
      expect(getTableName(account)).toBe("account");
    });

    it("should have required columns", () => {
      expect(account.id).toBeDefined();
      expect(account.userId).toBeDefined();
      expect(account.accountId).toBeDefined();
      expect(account.providerId).toBeDefined();
      expect(account.accessToken).toBeDefined();
      expect(account.refreshToken).toBeDefined();
      expect(account.password).toBeDefined();
      expect(account.createdAt).toBeDefined();
      expect(account.updatedAt).toBeDefined();
    });
  });

  describe("verification table", () => {
    it("should have correct table name", () => {
      expect(getTableName(verification)).toBe("verification");
    });

    it("should have required columns", () => {
      expect(verification.id).toBeDefined();
      expect(verification.identifier).toBeDefined();
      expect(verification.value).toBeDefined();
      expect(verification.expiresAt).toBeDefined();
      expect(verification.createdAt).toBeDefined();
      expect(verification.updatedAt).toBeDefined();
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
      const user: User = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: false,
        image: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
      expect(user.id).toBe("1");
    });

    it("should export Session types", () => {
      const sess: Session = {
        id: "1",
        userId: "1",
        token: "token_123",
        expiresAt: "2024-02-01T00:00:00.000Z",
        ipAddress: null,
        userAgent: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
      expect(sess.token).toBe("token_123");
    });

    it("should export Account types", () => {
      const acc: Account = {
        id: "1",
        userId: "1",
        accountId: "acc_123",
        providerId: "credential",
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        idToken: null,
        password: "hashed",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
      expect(acc.providerId).toBe("credential");
    });

    it("should export Verification types", () => {
      const ver: Verification = {
        id: "1",
        identifier: "test@example.com",
        value: "token_abc",
        expiresAt: "2024-02-01T00:00:00.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
      expect(ver.identifier).toBe("test@example.com");
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
