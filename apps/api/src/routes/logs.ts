/**
 * Toilet Log Management API Routes
 *
 * REST API endpoints for toilet log CRUD operations.
 * All routes require authentication via Clerk.
 */

import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { getUserId } from "../middleware/auth";
import { handleDomainError } from "../utils/handle-domain-error";
import { createCatRepository } from "../repositories/cat-repository";
import { createLogRepository } from "../repositories/log-repository";
import {
  addLog,
  updateLog,
  deleteLog,
  getLog,
  getHistory,
} from "../workflows/log-workflows";

/**
 * Log routes factory.
 * Creates a Hono app with all toilet log-related endpoints.
 */
export const createLogRoutes = () => {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  /**
   * GET /api/logs
   * Get toilet log history with filtering and pagination.
   * Query parameters:
   *   - catId: Filter by cat ID (optional)
   *   - type: Filter by toilet type - "urine" or "feces" (optional)
   *   - from: Filter by start date (optional)
   *   - to: Filter by end date (optional)
   *   - page: Page number (default: 1)
   *   - limit: Items per page (default: 20, max: 100)
   */
  app.get("/", async (c) => {
    const userId = getUserId(c);
    const logRepo = createLogRepository(c.env.DB);

    // Parse query parameters
    const query = {
      catId: c.req.query("catId"),
      type: c.req.query("type"),
      from: c.req.query("from"),
      to: c.req.query("to"),
      page: c.req.query("page"),
      limit: c.req.query("limit"),
    };

    const result = await getHistory(query, userId, logRepo);

    return result.match(
      (paginatedLogs) => c.json(paginatedLogs),
      (error) => handleDomainError(c, error)
    );
  });

  /**
   * GET /api/logs/:id
   * Get a single toilet log by ID.
   */
  app.get("/:id", async (c) => {
    const userId = getUserId(c);
    const logId = c.req.param("id");
    const logRepo = createLogRepository(c.env.DB);

    const result = await getLog(logId, userId, logRepo);

    return result.match(
      (log) => c.json({ log }),
      (error) => handleDomainError(c, error)
    );
  });

  /**
   * POST /api/logs
   * Add a new toilet log.
   * Body:
   *   - catId: Cat ID (required)
   *   - type: "urine" or "feces" (required)
   *   - timestamp: ISO datetime string (optional, defaults to now)
   *   - note: Additional notes (optional)
   */
  app.post("/", async (c) => {
    const userId = getUserId(c);
    const catRepo = createCatRepository(c.env.DB);
    const logRepo = createLogRepository(c.env.DB);

    const body = await c.req.json().catch(() => ({}));
    const result = await addLog(body, userId, catRepo, logRepo);

    return result.match(
      (log) => c.json({ log }, 201),
      (error) => handleDomainError(c, error)
    );
  });

  /**
   * PUT /api/logs/:id
   * Update an existing toilet log.
   * Body (all optional):
   *   - type: "urine" or "feces"
   *   - timestamp: ISO datetime string
   *   - note: Additional notes
   */
  app.put("/:id", async (c) => {
    const userId = getUserId(c);
    const logId = c.req.param("id");
    const logRepo = createLogRepository(c.env.DB);

    const body = await c.req.json().catch(() => ({}));
    const result = await updateLog(logId, body, userId, logRepo);

    return result.match(
      (log) => c.json({ log }),
      (error) => handleDomainError(c, error)
    );
  });

  /**
   * DELETE /api/logs/:id
   * Delete a toilet log. Requires ?confirmed=true query parameter.
   */
  app.delete("/:id", async (c) => {
    const userId = getUserId(c);
    const logId = c.req.param("id");
    const confirmed = c.req.query("confirmed") === "true";
    const logRepo = createLogRepository(c.env.DB);

    const result = await deleteLog(logId, confirmed, userId, logRepo);

    return result.match(
      () => c.json({ success: true }),
      (error) => handleDomainError(c, error)
    );
  });

  return app;
};
