import { describe, it, expect, vi } from "vitest";

// Mock createAuth to avoid D1 dependency in tests
vi.mock("./lib/auth", () => ({
  createAuth: () => ({
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
    handler: vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
  }),
}));

import app from "./index";

const mockEnv = {
  DB: {} as D1Database,
  BUCKET: {} as R2Bucket,
  PUBLIC_BUCKET_URL: "https://images.example.com",
  BETTER_AUTH_SECRET: "test-secret",
  BETTER_AUTH_URL: "http://localhost:8787",
};

describe("NekoLog API", () => {
  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const res = await app.fetch(
        new Request("http://localhost/api/health"),
        mockEnv
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual({
        status: "ok",
        service: "nekolog-api",
      });
    });

    it("should return JSON content type", async () => {
      const res = await app.fetch(
        new Request("http://localhost/api/health"),
        mockEnv
      );

      expect(res.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("GET /api/auth/*", () => {
    it("should delegate to Better Auth handler without authentication", async () => {
      const res = await app.fetch(
        new Request("http://localhost/api/auth/session"),
        mockEnv
      );

      // Should reach the handler (not 500 or middleware error)
      expect(res.status).not.toBe(500);
    });
  });

  describe("Protected API routes", () => {
    it("should return 401 for unauthenticated requests to /api/cats", async () => {
      const res = await app.fetch(
        new Request("http://localhost/api/cats"),
        mockEnv
      );

      expect(res.status).toBe(401);
    });
  });

  describe("Not found", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await app.fetch(
        new Request("http://localhost/unknown"),
        mockEnv
      );

      expect(res.status).toBe(404);
    });
  });
});
