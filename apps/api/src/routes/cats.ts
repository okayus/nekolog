/**
 * Cat Management API Routes
 *
 * REST API endpoints for cat CRUD operations.
 * All routes require authentication via Clerk.
 */

import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { getUserId } from "../middleware/auth";
import { handleDomainError } from "../utils/handle-domain-error";
import { createCatRepository } from "../repositories/cat-repository";
import {
  registerCat,
  updateCat,
  deleteCat,
  getCat,
  listCats,
} from "../workflows/cat-workflows";

/**
 * Cat routes factory.
 * Creates a Hono app with all cat-related endpoints.
 */
export const createCatRoutes = () => {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  /**
   * GET /api/cats
   * List all cats for the authenticated user.
   */
  app.get("/", async (c) => {
    const userId = getUserId(c);
    const catRepo = createCatRepository(c.env.DB);

    const result = await listCats(userId, catRepo);

    return result.match(
      (cats) => c.json({ cats }),
      (error) => handleDomainError(c, error)
    );
  });

  /**
   * GET /api/cats/:id
   * Get a single cat by ID.
   */
  app.get("/:id", async (c) => {
    const userId = getUserId(c);
    const catId = c.req.param("id");
    const catRepo = createCatRepository(c.env.DB);

    const result = await getCat(catId, userId, catRepo);

    return result.match(
      (cat) => c.json({ cat }),
      (error) => handleDomainError(c, error)
    );
  });

  /**
   * POST /api/cats
   * Register a new cat.
   */
  app.post("/", async (c) => {
    const userId = getUserId(c);
    const catRepo = createCatRepository(c.env.DB);

    const body = await c.req.json().catch(() => ({}));
    const result = await registerCat(body, userId, catRepo);

    return result.match(
      (cat) => c.json({ cat }, 201),
      (error) => handleDomainError(c, error)
    );
  });

  /**
   * PUT /api/cats/:id
   * Update an existing cat.
   */
  app.put("/:id", async (c) => {
    const userId = getUserId(c);
    const catId = c.req.param("id");
    const catRepo = createCatRepository(c.env.DB);

    const body = await c.req.json().catch(() => ({}));
    const result = await updateCat(catId, body, userId, catRepo);

    return result.match(
      (cat) => c.json({ cat }),
      (error) => handleDomainError(c, error)
    );
  });

  /**
   * DELETE /api/cats/:id
   * Delete a cat. Requires ?confirmed=true query parameter.
   */
  app.delete("/:id", async (c) => {
    const userId = getUserId(c);
    const catId = c.req.param("id");
    const confirmed = c.req.query("confirmed") === "true";
    const catRepo = createCatRepository(c.env.DB);

    const result = await deleteCat(catId, confirmed, userId, catRepo);

    return result.match(
      () => c.json({ success: true }),
      (error) => handleDomainError(c, error)
    );
  });

  return app;
};
