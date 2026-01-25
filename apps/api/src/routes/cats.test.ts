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

// Mock the workflows
vi.mock("../workflows/cat-workflows", () => ({
  registerCat: vi.fn(),
  updateCat: vi.fn(),
  deleteCat: vi.fn(),
  getCat: vi.fn(),
  listCats: vi.fn(),
}));

import { createCatRoutes } from "./cats";
import { requireAuth } from "../middleware/auth";
import type { Bindings, Variables } from "../types";
import { okAsync, errAsync } from "neverthrow";
import { DomainErrors } from "@nekolog/shared";
import {
  registerCat,
  updateCat,
  deleteCat,
  getCat,
  listCats,
} from "../workflows/cat-workflows";

describe("Cat Routes", () => {
  const mockCat = {
    id: "cat_123",
    userId: "user_123",
    name: "みけ",
    birthDate: "2020-01-01",
    breed: "三毛猫",
    weight: 4.5,
    imageUrl: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  // Mock environment bindings
  const mockEnv = {
    DB: {} as D1Database,
    BUCKET: {} as R2Bucket,
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

    // Create app with requireAuth and cat routes
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    app.use("*", requireAuth);
    app.route("/", createCatRoutes());
  });

  describe("GET /", () => {
    it("should return list of cats", async () => {
      vi.mocked(listCats).mockReturnValue(okAsync([mockCat]));

      const res = await request("/", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { cats: typeof mockCat[] };
      expect(body.cats).toHaveLength(1);
      expect(body.cats[0]!.name).toBe("みけ");
      expect(listCats).toHaveBeenCalledWith("user_123", mockCatRepo);
    });

    it("should return empty array when user has no cats", async () => {
      vi.mocked(listCats).mockReturnValue(okAsync([]));

      const res = await request("/", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { cats: typeof mockCat[] };
      expect(body.cats).toEqual([]);
    });

    it("should return 500 on database error", async () => {
      vi.mocked(listCats).mockReturnValue(
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
    it("should return a cat when found", async () => {
      vi.mocked(getCat).mockReturnValue(okAsync(mockCat));

      const res = await request("/cat_123", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { cat: typeof mockCat };
      expect(body.cat.id).toBe("cat_123");
      expect(body.cat.name).toBe("みけ");
      expect(getCat).toHaveBeenCalledWith("cat_123", "user_123", mockCatRepo);
    });

    it("should return 404 when cat not found", async () => {
      vi.mocked(getCat).mockReturnValue(
        errAsync(DomainErrors.notFound("cat", "cat_123"))
      );

      const res = await request("/cat_123", {
        method: "GET",
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as {
        error: { type: string; resource: string };
      };
      expect(body.error.type).toBe("not_found");
      expect(body.error.resource).toBe("cat");
    });
  });

  describe("POST /", () => {
    it("should create a cat with valid input", async () => {
      vi.mocked(registerCat).mockReturnValue(okAsync(mockCat));

      const res = await request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "みけ",
          birthDate: "2020-01-01",
          breed: "三毛猫",
          weight: 4.5,
        }),
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as { cat: typeof mockCat };
      expect(body.cat.name).toBe("みけ");
      expect(registerCat).toHaveBeenCalledWith(
        {
          name: "みけ",
          birthDate: "2020-01-01",
          breed: "三毛猫",
          weight: 4.5,
        },
        "user_123",
        mockCatRepo
      );
    });

    it("should return 400 for validation error", async () => {
      vi.mocked(registerCat).mockReturnValue(
        errAsync(
          DomainErrors.validation(
            "name",
            "名前は1文字以上50文字以下で入力してください"
          )
        )
      );

      const res = await request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as {
        error: { type: string; field: string };
      };
      expect(body.error.type).toBe("validation");
      expect(body.error.field).toBe("name");
    });

    it("should handle invalid JSON body", async () => {
      vi.mocked(registerCat).mockReturnValue(
        errAsync(
          DomainErrors.validation("name", "名前は必須です")
        )
      );

      const res = await request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(res.status).toBe(400);
      // Invalid JSON results in empty object passed to registerCat
      expect(registerCat).toHaveBeenCalledWith({}, "user_123", mockCatRepo);
    });
  });

  describe("PUT /:id", () => {
    it("should update a cat with valid input", async () => {
      const updatedCat = { ...mockCat, name: "たま" };
      vi.mocked(updateCat).mockReturnValue(okAsync(updatedCat));

      const res = await request("/cat_123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "たま" }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { cat: typeof mockCat };
      expect(body.cat.name).toBe("たま");
      expect(updateCat).toHaveBeenCalledWith(
        "cat_123",
        { name: "たま" },
        "user_123",
        mockCatRepo
      );
    });

    it("should return 404 when cat not found", async () => {
      vi.mocked(updateCat).mockReturnValue(
        errAsync(DomainErrors.notFound("cat", "cat_123"))
      );

      const res = await request("/cat_123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "たま" }),
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("not_found");
    });

    it("should return 400 for validation error", async () => {
      vi.mocked(updateCat).mockReturnValue(
        errAsync(DomainErrors.validation("weight", "体重は0より大きい必要があります"))
      );

      const res = await request("/cat_123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: -1 }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("validation");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete a cat when confirmed", async () => {
      vi.mocked(deleteCat).mockReturnValue(okAsync(undefined));

      const res = await request("/cat_123?confirmed=true", {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean };
      expect(body.success).toBe(true);
      expect(deleteCat).toHaveBeenCalledWith(
        "cat_123",
        true,
        "user_123",
        mockCatRepo
      );
    });

    it("should return 422 when not confirmed", async () => {
      vi.mocked(deleteCat).mockReturnValue(
        errAsync(DomainErrors.confirmationRequired())
      );

      const res = await request("/cat_123", {
        method: "DELETE",
      });

      expect(res.status).toBe(422);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("confirmation_required");
      expect(deleteCat).toHaveBeenCalledWith(
        "cat_123",
        false,
        "user_123",
        mockCatRepo
      );
    });

    it("should return 404 when cat not found", async () => {
      vi.mocked(deleteCat).mockReturnValue(
        errAsync(DomainErrors.notFound("cat", "cat_123"))
      );

      const res = await request("/cat_123?confirmed=true", {
        method: "DELETE",
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: { type: string } };
      expect(body.error.type).toBe("not_found");
    });
  });
});
