import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Mock @hono/clerk-auth before importing app
vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) =>
    next(),
  getAuth: vi.fn().mockReturnValue({ userId: "user_123" }),
}));

// Mock the cat repository
const mockCatRepo = {
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findById: vi.fn(),
  findAllByUserId: vi.fn(),
};

vi.mock("../repositories/cat-repository", () => ({
  createCatRepository: vi.fn(() => mockCatRepo),
}));

// Mock the log repository
const mockLogRepo = {
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findById: vi.fn(),
  findWithFilters: vi.fn(),
  aggregateByCat: vi.fn(),
  aggregateByPeriod: vi.fn(),
};

vi.mock("../repositories/log-repository", () => ({
  createLogRepository: vi.fn(() => mockLogRepo),
}));

// Mock the workflows
vi.mock("../workflows/log-workflows", () => ({
  addLog: vi.fn(),
  updateLog: vi.fn(),
  deleteLog: vi.fn(),
  getLog: vi.fn(),
  getHistory: vi.fn(),
}));

import { createLogRoutes } from "./logs";
import { requireAuth } from "../middleware/auth";
import type { Bindings, Variables } from "../types";
import { okAsync, errAsync } from "neverthrow";
import { DomainErrors } from "@nekolog/shared";
import {
  addLog,
  updateLog,
  deleteLog,
  getLog,
  getHistory,
} from "../workflows/log-workflows";

describe("Log Routes", () => {
  const catId = "11111111-1111-4111-8111-111111111111";
  const logId = "22222222-2222-4222-8222-222222222222";

  const mockLog = {
    id: logId,
    catId,
    type: "urine" as const,
    timestamp: "2024-01-01T10:00:00.000Z",
    note: "正常",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T10:00:00.000Z",
  };

  const mockPaginatedLogs = {
    logs: [mockLog],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  // Mock environment bindings
  const mockEnv = {
    DB: {} as D1Database,
    BUCKET: {} as R2Bucket,
    PUBLIC_BUCKET_URL: "https://images.example.com",
    CLERK_SECRET_KEY: "test-secret",
    CLERK_PUBLISHABLE_KEY: "test-publishable",
  };

  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;

  // Helper to make requests with mock env
  const request = async (
    path: string,
    init?: RequestInit
  ): Promise<Response> => {
    const req = new Request(`http://localhost${path}`, init);
    return app.fetch(req, mockEnv);
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create app with requireAuth and log routes
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    app.use("*", requireAuth);
    app.route("/", createLogRoutes());
  });

  describe("GET /", () => {
    it("should return paginated logs", async () => {
      vi.mocked(getHistory).mockReturnValue(okAsync(mockPaginatedLogs));

      const res = await request("/", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as typeof mockPaginatedLogs;
      expect(body.logs).toHaveLength(1);
      expect(body.total).toBe(1);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(20);
      expect(getHistory).toHaveBeenCalledWith(
        {
          catId: undefined,
          type: undefined,
          from: undefined,
          to: undefined,
          page: undefined,
          limit: undefined,
        },
        "user_123",
        mockLogRepo
      );
    });

    it("should pass query parameters to getHistory", async () => {
      vi.mocked(getHistory).mockReturnValue(okAsync(mockPaginatedLogs));

      const res = await request(
        `/?catId=${catId}&type=urine&from=2024-01-01T00:00:00.000Z&to=2024-01-31T23:59:59.999Z&page=2&limit=50`,
        {
          method: "GET",
        }
      );

      expect(res.status).toBe(200);
      expect(getHistory).toHaveBeenCalledWith(
        {
          catId,
          type: "urine",
          from: "2024-01-01T00:00:00.000Z",
          to: "2024-01-31T23:59:59.999Z",
          page: "2",
          limit: "50",
        },
        "user_123",
        mockLogRepo
      );
    });

    it("should return empty array when no logs found", async () => {
      const emptyResult = { ...mockPaginatedLogs, logs: [], total: 0, totalPages: 0 };
      vi.mocked(getHistory).mockReturnValue(okAsync(emptyResult));

      const res = await request("/", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as typeof mockPaginatedLogs;
      expect(body.logs).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("should return 400 for validation error", async () => {
      vi.mocked(getHistory).mockReturnValue(
        errAsync(DomainErrors.validation("type", "無効なタイプです"))
      );

      const res = await request("/?type=invalid", {
        method: "GET",
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("validation");
    });

    it("should return 500 on database error", async () => {
      vi.mocked(getHistory).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const res = await request("/", {
        method: "GET",
      });

      expect(res.status).toBe(500);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("internal");
    });
  });

  describe("GET /:id", () => {
    it("should return a log when found", async () => {
      vi.mocked(getLog).mockReturnValue(okAsync(mockLog));

      const res = await request(`/${logId}`, {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { log: typeof mockLog };
      expect(body.log.id).toBe(logId);
      expect(body.log.type).toBe("urine");
      expect(getLog).toHaveBeenCalledWith(logId, "user_123", mockLogRepo);
    });

    it("should return 404 when log not found", async () => {
      vi.mocked(getLog).mockReturnValue(
        errAsync(DomainErrors.notFound("toilet_log", logId))
      );

      const res = await request(`/${logId}`, {
        method: "GET",
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as {
        error: { type: string; resource: string };
      };
      expect(body.error.type).toBe("not_found");
      expect(body.error.resource).toBe("toilet_log");
    });

    it("should return 500 on database error", async () => {
      vi.mocked(getLog).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const res = await request(`/${logId}`, {
        method: "GET",
      });

      expect(res.status).toBe(500);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("internal");
    });
  });

  describe("POST /", () => {
    it("should create a log with valid input", async () => {
      vi.mocked(addLog).mockReturnValue(okAsync(mockLog));

      const res = await request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catId,
          type: "urine",
          timestamp: "2024-01-01T10:00:00.000Z",
          note: "正常",
        }),
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as { log: typeof mockLog };
      expect(body.log.type).toBe("urine");
      expect(addLog).toHaveBeenCalledWith(
        {
          catId,
          type: "urine",
          timestamp: "2024-01-01T10:00:00.000Z",
          note: "正常",
        },
        "user_123",
        mockCatRepo,
        mockLogRepo
      );
    });

    it("should return 400 for validation error", async () => {
      vi.mocked(addLog).mockReturnValue(
        errAsync(DomainErrors.validation("catId", "有効な猫IDを指定してください"))
      );

      const res = await request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catId: "invalid", type: "urine" }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as {
        error: { type: string; field: string };
      };
      expect(body.error.type).toBe("validation");
      expect(body.error.field).toBe("catId");
    });

    it("should return 404 when cat not found", async () => {
      vi.mocked(addLog).mockReturnValue(
        errAsync(DomainErrors.notFound("cat", catId))
      );

      const res = await request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catId, type: "urine" }),
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("not_found");
    });

    it("should handle invalid JSON body", async () => {
      vi.mocked(addLog).mockReturnValue(
        errAsync(DomainErrors.validation("catId", "catIdは必須です"))
      );

      const res = await request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(res.status).toBe(400);
      // Invalid JSON results in empty object passed to addLog
      expect(addLog).toHaveBeenCalledWith(
        {},
        "user_123",
        mockCatRepo,
        mockLogRepo
      );
    });
  });

  describe("PUT /:id", () => {
    it("should update a log with valid input", async () => {
      const updatedLog = { ...mockLog, note: "異常なし" };
      vi.mocked(updateLog).mockReturnValue(okAsync(updatedLog));

      const res = await request(`/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "異常なし" }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { log: typeof mockLog };
      expect(body.log.note).toBe("異常なし");
      expect(updateLog).toHaveBeenCalledWith(
        logId,
        { note: "異常なし" },
        "user_123",
        mockLogRepo
      );
    });

    it("should update type field", async () => {
      const updatedLog = { ...mockLog, type: "feces" as const };
      vi.mocked(updateLog).mockReturnValue(okAsync(updatedLog));

      const res = await request(`/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "feces" }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { log: typeof mockLog };
      expect(body.log.type).toBe("feces");
    });

    it("should return 404 when log not found", async () => {
      vi.mocked(updateLog).mockReturnValue(
        errAsync(DomainErrors.notFound("toilet_log", logId))
      );

      const res = await request(`/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "更新" }),
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("not_found");
    });

    it("should return 400 for validation error", async () => {
      vi.mocked(updateLog).mockReturnValue(
        errAsync(DomainErrors.validation("type", "無効なタイプです"))
      );

      const res = await request(`/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "invalid" }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("validation");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete a log when confirmed", async () => {
      vi.mocked(deleteLog).mockReturnValue(okAsync(undefined));

      const res = await request(`/${logId}?confirmed=true`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean };
      expect(body.success).toBe(true);
      expect(deleteLog).toHaveBeenCalledWith(
        logId,
        true,
        "user_123",
        mockLogRepo
      );
    });

    it("should return 422 when not confirmed", async () => {
      vi.mocked(deleteLog).mockReturnValue(
        errAsync(DomainErrors.confirmationRequired())
      );

      const res = await request(`/${logId}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(422);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("confirmation_required");
      expect(deleteLog).toHaveBeenCalledWith(
        logId,
        false,
        "user_123",
        mockLogRepo
      );
    });

    it("should return 404 when log not found", async () => {
      vi.mocked(deleteLog).mockReturnValue(
        errAsync(DomainErrors.notFound("toilet_log", logId))
      );

      const res = await request(`/${logId}?confirmed=true`, {
        method: "DELETE",
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("not_found");
    });

    it("should return 500 on database error", async () => {
      vi.mocked(deleteLog).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const res = await request(`/${logId}?confirmed=true`, {
        method: "DELETE",
      });

      expect(res.status).toBe(500);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("internal");
    });
  });
});
