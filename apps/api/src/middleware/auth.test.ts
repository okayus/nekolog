import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import type { DomainError } from "@nekolog/shared";

// Mock createAuth
const mockGetSession = vi.fn();
vi.mock("../lib/auth", () => ({
  createAuth: () => ({
    api: {
      getSession: mockGetSession,
    },
  }),
}));

import { authMiddleware, requireAuth, getUserId } from "./auth";

// Type for error response
interface ErrorResponse {
  error: DomainError;
}

// Type for authenticated response
interface UserIdResponse {
  userId: string;
}

const mockEnv = {
  DB: {} as D1Database,
  BUCKET: {} as R2Bucket,
  PUBLIC_BUCKET_URL: "https://images.example.com",
  BETTER_AUTH_SECRET: "test-secret",
  BETTER_AUTH_URL: "http://localhost:8787",
};

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authMiddleware", () => {
    it("should set userId when session is valid", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
        session: { id: "sess_1", token: "tok_1" },
      });

      const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
      app.use("*", authMiddleware());
      app.get("/test", (c) => c.json({ userId: c.get("userId") }));

      const res = await app.fetch(
        new Request("http://localhost/test"),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as UserIdResponse;
      expect(body.userId).toBe("user_123");
    });

    it("should not set userId when session is null", async () => {
      mockGetSession.mockResolvedValue(null);

      const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
      app.use("*", authMiddleware());
      app.get("/test", (c) => c.json({ userId: c.get("userId") ?? null }));

      const res = await app.fetch(
        new Request("http://localhost/test"),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { userId: null };
      expect(body.userId).toBeNull();
    });
  });

  describe("authMiddleware + requireAuth integration", () => {
    it("should return 200 when session is valid", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user_abc", email: "test@example.com" },
        session: { id: "sess_1", token: "tok_1" },
      });

      const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
      app.use("*", authMiddleware());
      app.use("*", requireAuth);
      app.get("/protected", (c) => c.json({ userId: c.get("userId") }));

      const res = await app.fetch(
        new Request("http://localhost/protected"),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as UserIdResponse;
      expect(body.userId).toBe("user_abc");
    });

    it("should return 401 when session is null", async () => {
      mockGetSession.mockResolvedValue(null);

      const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
      app.use("*", authMiddleware());
      app.use("*", requireAuth);
      app.get("/protected", (c) => c.json({ message: "protected" }));

      const res = await app.fetch(
        new Request("http://localhost/protected"),
        mockEnv
      );

      expect(res.status).toBe(401);
      const body = (await res.json()) as ErrorResponse;
      expect(body.error).toEqual({
        type: "unauthorized",
        message: "認証が必要です。ログインしてください。",
      });
    });
  });

  describe("requireAuth", () => {
    it("should return 401 when userId is not set", async () => {
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
