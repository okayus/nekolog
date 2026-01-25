import { describe, it, expect } from "vitest";
import app from "./index";

describe("NekoLog API", () => {
  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const res = await app.request("/api/health");

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual({
        status: "ok",
        service: "nekolog-api",
      });
    });

    it("should return JSON content type", async () => {
      const res = await app.request("/api/health");

      expect(res.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("Not found", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await app.request("/unknown");

      expect(res.status).toBe(404);
    });
  });
});
