/**
 * @nekolog/api - NekoLog API Server
 *
 * Cloudflare Workers based API server using Hono.
 * This is a placeholder that will be replaced with the actual implementation.
 */

export default {
  async fetch(): Promise<Response> {
    return new Response(JSON.stringify({ status: "ok", message: "NekoLog API" }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
