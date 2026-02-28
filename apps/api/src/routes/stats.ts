/**
 * Statistics API Routes
 *
 * REST API endpoints for dashboard statistics.
 * All routes require authentication via Clerk.
 */

import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { getUserId } from "../middleware/auth";
import { handleDomainError } from "../utils/handle-domain-error";
import { createCatRepository } from "../repositories/cat-repository";
import { createLogRepository } from "../repositories/log-repository";
import { getDailySummary, getChartData } from "../workflows/stats-workflows";

/**
 * Stats routes factory.
 * Creates a Hono app with all statistics-related endpoints.
 */
export const createStatsRoutes = () => {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  /**
   * GET /api/stats/summary
   * Get today's daily summary for all cats.
   */
  app.get("/summary", async (c) => {
    const userId = getUserId(c);
    const catRepo = createCatRepository(c.env.DB);
    const logRepo = createLogRepository(c.env.DB);

    const result = await getDailySummary(userId, catRepo, logRepo);

    return result.match(
      (summary) => c.json(summary),
      (error) => handleDomainError(c, error)
    );
  });

  /**
   * GET /api/stats/chart
   * Get chart data for statistics visualization.
   * Query parameters:
   *   - catId: Filter by cat ID (optional)
   *   - period: "today" | "week" | "month" (optional, default: "today")
   *   - from: Start date ISO string (optional)
   *   - to: End date ISO string (optional)
   */
  app.get("/chart", async (c) => {
    const userId = getUserId(c);
    const catRepo = createCatRepository(c.env.DB);
    const logRepo = createLogRepository(c.env.DB);

    const query = {
      catId: c.req.query("catId"),
      period: c.req.query("period"),
      from: c.req.query("from"),
      to: c.req.query("to"),
    };

    const result = await getChartData(query, userId, catRepo, logRepo);

    return result.match(
      (chartData) => c.json(chartData),
      (error) => handleDomainError(c, error)
    );
  });

  return app;
};
