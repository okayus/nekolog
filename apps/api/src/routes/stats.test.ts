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
vi.mock("../workflows/stats-workflows", () => ({
  getDailySummary: vi.fn(),
  getChartData: vi.fn(),
}));

import { createStatsRoutes } from "./stats";
import { requireAuth } from "../middleware/auth";
import type { Bindings, Variables } from "../types";
import { okAsync, errAsync } from "neverthrow";
import { DomainErrors } from "@nekolog/shared";
import { getDailySummary, getChartData } from "../workflows/stats-workflows";

describe("Stats Routes", () => {
  const catId = "11111111-1111-4111-8111-111111111111";

  const mockDailySummary = {
    date: "2024-01-01",
    cats: [
      {
        catId,
        catName: "タマ",
        urineCount: 3,
        fecesCount: 1,
        totalCount: 4,
      },
    ],
    totalUrineCount: 3,
    totalFecesCount: 1,
    totalCount: 4,
  };

  const mockChartData = {
    catId: null,
    catName: null,
    period: "daily" as const,
    data: [
      { date: "2024-01-01", urineCount: 3, fecesCount: 1, totalCount: 4 },
      { date: "2024-01-02", urineCount: 2, fecesCount: 2, totalCount: 4 },
    ],
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

    // Create app with requireAuth and stats routes
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    app.use("*", requireAuth);
    app.route("/", createStatsRoutes());
  });

  describe("GET /summary", () => {
    it("should return daily summary", async () => {
      vi.mocked(getDailySummary).mockReturnValue(okAsync(mockDailySummary));

      const res = await request("/summary", { method: "GET" });

      expect(res.status).toBe(200);
      const body = (await res.json()) as typeof mockDailySummary;
      expect(body.date).toBe("2024-01-01");
      expect(body.cats).toHaveLength(1);
      expect(body.cats[0]!.catName).toBe("タマ");
      expect(body.totalUrineCount).toBe(3);
      expect(body.totalFecesCount).toBe(1);
      expect(body.totalCount).toBe(4);
      expect(getDailySummary).toHaveBeenCalledWith(
        "user_123",
        mockCatRepo,
        mockLogRepo
      );
    });

    it("should return empty summary when no cats", async () => {
      const emptySummary = {
        ...mockDailySummary,
        cats: [],
        totalUrineCount: 0,
        totalFecesCount: 0,
        totalCount: 0,
      };
      vi.mocked(getDailySummary).mockReturnValue(okAsync(emptySummary));

      const res = await request("/summary", { method: "GET" });

      expect(res.status).toBe(200);
      const body = (await res.json()) as typeof mockDailySummary;
      expect(body.cats).toEqual([]);
      expect(body.totalCount).toBe(0);
    });

    it("should return 500 on database error", async () => {
      vi.mocked(getDailySummary).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const res = await request("/summary", { method: "GET" });

      expect(res.status).toBe(500);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("internal");
    });
  });

  describe("GET /chart", () => {
    it("should return chart data with default parameters", async () => {
      vi.mocked(getChartData).mockReturnValue(okAsync(mockChartData));

      const res = await request("/chart", { method: "GET" });

      expect(res.status).toBe(200);
      const body = (await res.json()) as typeof mockChartData;
      expect(body.period).toBe("daily");
      expect(body.data).toHaveLength(2);
      expect(getChartData).toHaveBeenCalledWith(
        {
          catId: undefined,
          period: undefined,
          from: undefined,
          to: undefined,
        },
        "user_123",
        mockCatRepo,
        mockLogRepo
      );
    });

    it("should pass query parameters to getChartData", async () => {
      vi.mocked(getChartData).mockReturnValue(okAsync(mockChartData));

      const res = await request(
        `/chart?catId=${catId}&period=week&from=2024-01-01T00:00:00.000Z&to=2024-01-31T23:59:59.999Z`,
        { method: "GET" }
      );

      expect(res.status).toBe(200);
      expect(getChartData).toHaveBeenCalledWith(
        {
          catId,
          period: "week",
          from: "2024-01-01T00:00:00.000Z",
          to: "2024-01-31T23:59:59.999Z",
        },
        "user_123",
        mockCatRepo,
        mockLogRepo
      );
    });

    it("should return chart data filtered by cat", async () => {
      const catChartData = {
        ...mockChartData,
        catId,
        catName: "タマ",
      };
      vi.mocked(getChartData).mockReturnValue(okAsync(catChartData));

      const res = await request(`/chart?catId=${catId}`, { method: "GET" });

      expect(res.status).toBe(200);
      const body = (await res.json()) as typeof catChartData;
      expect(body.catId).toBe(catId);
      expect(body.catName).toBe("タマ");
    });

    it("should return 400 for validation error", async () => {
      vi.mocked(getChartData).mockReturnValue(
        errAsync(DomainErrors.validation("period", "無効な期間です"))
      );

      const res = await request("/chart?period=invalid", { method: "GET" });

      expect(res.status).toBe(400);
      const body = (await res.json()) as {
        error: { type: string; field: string };
      };
      expect(body.error.type).toBe("validation");
      expect(body.error.field).toBe("period");
    });

    it("should return 404 when cat not found", async () => {
      vi.mocked(getChartData).mockReturnValue(
        errAsync(DomainErrors.notFound("cat", catId))
      );

      const res = await request(`/chart?catId=${catId}`, { method: "GET" });

      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("not_found");
    });

    it("should return 500 on database error", async () => {
      vi.mocked(getChartData).mockReturnValue(
        errAsync(DomainErrors.database("DB error"))
      );

      const res = await request("/chart", { method: "GET" });

      expect(res.status).toBe(500);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("internal");
    });
  });
});
