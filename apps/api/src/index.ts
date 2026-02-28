/**
 * @nekolog/api - NekoLog API Server
 *
 * Cloudflare Workers based API server using Hono.
 * Provides REST API for cat toilet tracking.
 */

import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import { clerkAuth, requireAuth } from "./middleware/auth";
import { createCatRoutes } from "./routes/cats";
import { createLogRoutes } from "./routes/logs";

// Create Hono app with typed bindings
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply Clerk middleware to all routes
app.use("*", clerkAuth());

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

// Export app type for RPC client
export type AppType = typeof app;

// Export app as default for Cloudflare Workers
export default app;
