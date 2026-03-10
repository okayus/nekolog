/**
 * @nekolog/api - NekoLog API Server
 *
 * Cloudflare Workers based API server using Hono.
 * Provides REST API for cat toilet tracking.
 */

import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import { authMiddleware, requireAuth } from "./middleware/auth";
import { createAuth } from "./lib/auth";
import { createCatRoutes } from "./routes/cats";
import { createLogRoutes } from "./routes/logs";
import { createStatsRoutes } from "./routes/stats";

// Create Hono app with typed bindings
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Better Auth handler — must be before authMiddleware to allow unauthenticated access
app.all("/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// Apply Better Auth session validation to all routes
app.use("*", authMiddleware());

// Health check endpoint (public, no authentication required)
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "nekolog-api",
  });
});

// Protected API routes require authentication
// Apply requireAuth middleware to all /api/* routes except /api/health
app.use("/api/cats/*", requireAuth);
app.use("/api/logs/*", requireAuth);
app.use("/api/stats/*", requireAuth);

// Mount cat routes
app.route("/api/cats", createCatRoutes());

// Mount log routes
app.route("/api/logs", createLogRoutes());

// Mount stats routes
app.route("/api/stats", createStatsRoutes());

// Export app type for RPC client
export type AppType = typeof app;

// Export app as default for Cloudflare Workers
export default app;
