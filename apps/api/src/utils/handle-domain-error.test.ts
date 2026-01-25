import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { DomainErrors } from "@nekolog/shared";
import { handleDomainError, type ApiErrorResponse } from "./handle-domain-error";

describe("handleDomainError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("validation error", () => {
    it("should return 400 with error details", async () => {
      const app = new Hono();
      app.get("/test", (c) => {
        const error = DomainErrors.validation("name", "名前は必須です");
        return handleDomainError(c, error);
      });

      const res = await app.request("/test");

      expect(res.status).toBe(400);
      const body = (await res.json()) as ApiErrorResponse;
      expect(body.error).toEqual({
        type: "validation",
        field: "name",
        message: "名前は必須です",
      });
    });
  });

  describe("not_found error", () => {
    it("should return 404 with error details", async () => {
      const app = new Hono();
      app.get("/test", (c) => {
        const error = DomainErrors.notFound("cat", "cat_123");
        return handleDomainError(c, error);
      });

      const res = await app.request("/test");

      expect(res.status).toBe(404);
      const body = (await res.json()) as ApiErrorResponse;
      expect(body.error).toEqual({
        type: "not_found",
        resource: "cat",
        id: "cat_123",
      });
    });
  });

  describe("unauthorized error", () => {
    it("should return 401 with error details", async () => {
      const app = new Hono();
      app.get("/test", (c) => {
        const error = DomainErrors.unauthorized("認証が必要です");
        return handleDomainError(c, error);
      });

      const res = await app.request("/test");

      expect(res.status).toBe(401);
      const body = (await res.json()) as ApiErrorResponse;
      expect(body.error).toEqual({
        type: "unauthorized",
        message: "認証が必要です",
      });
    });
  });

  describe("confirmation_required error", () => {
    it("should return 422 with error details", async () => {
      const app = new Hono();
      app.get("/test", (c) => {
        const error = DomainErrors.confirmationRequired();
        return handleDomainError(c, error);
      });

      const res = await app.request("/test");

      expect(res.status).toBe(422);
      const body = (await res.json()) as ApiErrorResponse;
      expect(body.error).toEqual({
        type: "confirmation_required",
      });
    });
  });

  describe("database error", () => {
    it("should return 500 with generic message", async () => {
      const app = new Hono();
      app.get("/test", (c) => {
        const error = DomainErrors.database("SQLITE_CONSTRAINT: UNIQUE constraint failed");
        return handleDomainError(c, error);
      });

      const res = await app.request("/test");

      expect(res.status).toBe(500);
      const body = (await res.json()) as ApiErrorResponse;
      expect(body.error).toEqual({
        type: "internal",
        message: "サーバーエラーが発生しました。しばらく経ってから再度お試しください。",
      });
    });

    it("should log the actual error message", async () => {
      const consoleSpy = vi.spyOn(console, "error");

      const app = new Hono();
      app.get("/test", (c) => {
        const error = DomainErrors.database("SQLITE_CONSTRAINT: UNIQUE constraint failed");
        return handleDomainError(c, error);
      });

      await app.request("/test");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Database Error]",
        "SQLITE_CONSTRAINT: UNIQUE constraint failed"
      );
    });
  });
});
