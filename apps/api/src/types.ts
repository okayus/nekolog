/**
 * Cloudflare Workers Bindings
 *
 * Type definitions for environment bindings used in the Hono app.
 */

/**
 * Environment bindings for Cloudflare Workers.
 * These are configured in wrangler.toml.
 */
export interface Bindings {
  // Cloudflare D1 Database
  DB: D1Database;

  // Cloudflare R2 Bucket for image storage
  BUCKET: R2Bucket;

  // Clerk Authentication
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
}

/**
 * Variables set during request processing.
 */
export interface Variables {
  // User ID from Clerk authentication
  userId?: string;
}
