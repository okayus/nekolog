/**
 * Cloudflare Workers Bindings
 *
 * Type definitions for environment bindings used in the Hono app.
 */

/**
 * Environment bindings for Cloudflare Workers.
 * These are configured in wrangler.jsonc.
 */
export interface Bindings {
  // Cloudflare D1 Database
  DB: D1Database;

  // Cloudflare R2 Bucket for image storage
  BUCKET: R2Bucket;

  // Public URL for R2 bucket (for generating public image URLs)
  PUBLIC_BUCKET_URL: string;

  // Better Auth
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

/**
 * Variables set during request processing.
 */
export interface Variables {
  // User ID from authentication (set by requireAuth middleware)
  userId?: string;
}
