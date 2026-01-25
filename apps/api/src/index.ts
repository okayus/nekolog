/**
 * @nekolog/api - NekoLog API Server
 *
 * Cloudflare Workers based API server using Hono.
 * Provides REST API for cat toilet tracking.
 */

import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

// Create Hono app with typed bindings
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Health check endpoint
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "nekolog-api",
  });
});

// Export app type for RPC client
export type AppType = typeof app;

// Export app as default for Cloudflare Workers
export default app;
