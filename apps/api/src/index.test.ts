import { describe, it, expect, vi } from "vitest";

// Mock createAuth to avoid D1 dependency in tests
vi.mock("./lib/auth", () => ({
  createAuth: () => ({
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
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
