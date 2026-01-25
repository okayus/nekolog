/**
 * Cloudflare Workers Bindings
 *
 * Type definitions for environment bindings used in the Hono app.
 */

import type { ClerkClient } from "@clerk/backend";

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

  // Clerk Authentication
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
}

/**
 * Variables set during request processing.
 */
export interface Variables {
  // User ID from Clerk authentication (set by requireAuth middleware)
  userId?: string;

  // Clerk client instance (set by clerkMiddleware)
  clerk: ClerkClient;
}
