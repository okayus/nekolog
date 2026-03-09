import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { requireAuth, getUserId } from "./auth";
import type { Bindings, Variables } from "../types";
import type { DomainError } from "@nekolog/shared";

// Type for error response
interface ErrorResponse {
  error: DomainError;
}

// Type for authenticated response
interface UserIdResponse {
  userId: string;
}

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireAuth", () => {
    it("should return 401 when user is not authenticated", async () => {
      const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
      app.use("*", requireAuth);
      app.get("/protected", (c) => c.json({ message: "protected" }));

      const res = await app.request("/protected");

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toEqual({
        type: "unauthorized",
        message: "認証が必要です。ログインしてください。",
      });
    });

    it("should call next when userId is set", async () => {
      const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
      // Simulate a middleware that sets userId before requireAuth
      app.use("*", async (c, next) => {
        c.set("userId", "user_123abc");
        await next();
      });
      app.use("*", requireAuth);
      app.get("/protected", (c) => {
        const userId = c.get("userId");
        return c.json({ userId });
      });

      const res = await app.request("/protected");

      expect(res.status).toBe(200);
      const body = (await res.json()) as UserIdResponse;
      expect(body.userId).toBe("user_123abc");
    });
  });

  describe("getUserId", () => {
    it("should return userId when set", () => {
      const mockContext = {
        get: vi.fn().mockReturnValue("user_123"),
      };

      const userId = getUserId(mockContext);

      expect(userId).toBe("user_123");
      expect(mockContext.get).toHaveBeenCalledWith("userId");
    });

    it("should throw error when userId is not set", () => {
      const mockContext = {
        get: vi.fn().mockReturnValue(undefined),
      };

      expect(() => getUserId(mockContext)).toThrow(
        "userId is not set. Ensure requireAuth middleware is applied."
      );
    });
  });
});
