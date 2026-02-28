/**
 * Hono RPC Client
 *
 * Type-safe API client using Hono's hc() helper.
 * Imports AppType from the API package for full type inference.
 */

import { hc } from "hono/client";
import type { AppType } from "@nekolog/api";

export const client = hc<AppType>("/");
