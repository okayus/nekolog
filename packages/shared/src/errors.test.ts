import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  type DomainError,
  DomainErrors,
  fromZodError,
} from "./errors";

describe("DomainErrors", () => {
  describe("validation", () => {
    it("should create a validation error with field and message", () => {
      const error = DomainErrors.validation("name", "名前は必須です");

      expect(error).toEqual({
        type: "validation",
        field: "name",
        message: "名前は必須です",
      });
    });
  });

  describe("notFound", () => {
    it("should create a not found error with resource and id", () => {
      const error = DomainErrors.notFound("cat", "abc-123");

      expect(error).toEqual({
        type: "not_found",
        resource: "cat",
        id: "abc-123",
      });
    });
  });

  describe("unauthorized", () => {
    it("should create an unauthorized error with message", () => {
      const error = DomainErrors.unauthorized("認証が必要です");

      expect(error).toEqual({
        type: "unauthorized",
        message: "認証が必要です",
      });
    });
  });

  describe("confirmationRequired", () => {
    it("should create a confirmation required error", () => {
      const error = DomainErrors.confirmationRequired();

      expect(error).toEqual({
        type: "confirmation_required",
      });
    });
  });

  describe("database", () => {
    it("should create a database error with message", () => {
      const error = DomainErrors.database("データベース接続エラー");

      expect(error).toEqual({
        type: "database",
        message: "データベース接続エラー",
      });
    });
  });
});

describe("fromZodError", () => {
  it("should convert Zod validation error to DomainError", () => {
    const schema = z.object({
      name: z.string().min(1, { message: "名前は必須です" }),
    });

    const result = schema.safeParse({ name: "" });
    expect(result.success).toBe(false);

    if (!result.success) {
      const domainError = fromZodError(result.error);

      expect(domainError.type).toBe("validation");
      expect(domainError).toMatchObject({
        type: "validation",
        field: "name",
        message: "名前は必須です",
      });
    }
  });

  it("should handle nested path in Zod error", () => {
    const schema = z.object({
      user: z.object({
        email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
      }),
    });

    const result = schema.safeParse({ user: { email: "invalid" } });
    expect(result.success).toBe(false);

    if (!result.success) {
      const domainError = fromZodError(result.error);

      expect(domainError).toMatchObject({
        type: "validation",
        field: "user.email",
        message: "有効なメールアドレスを入力してください",
      });
    }
  });

  it("should handle empty path with fallback", () => {
    const schema = z.string().min(1, { message: "値は必須です" });

    const result = schema.safeParse("");
    expect(result.success).toBe(false);

    if (!result.success) {
      const domainError = fromZodError(result.error);

      expect(domainError.type).toBe("validation");
      // Empty path should use "unknown" as fallback for root-level validation
      expect(domainError).toHaveProperty("field", "unknown");
    }
  });
});

describe("DomainError type", () => {
  it("should allow discriminated union type narrowing", () => {
    const error: DomainError = DomainErrors.validation("name", "error");

    // Type narrowing should work
    if (error.type === "validation") {
      expect(error.field).toBe("name");
      expect(error.message).toBe("error");
    }

    const notFoundError: DomainError = DomainErrors.notFound("cat", "123");
    if (notFoundError.type === "not_found") {
      expect(notFoundError.resource).toBe("cat");
      expect(notFoundError.id).toBe("123");
    }
  });
});
