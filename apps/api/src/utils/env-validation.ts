import { ok, err, type Result } from "neverthrow";
import type { Bindings } from "../types";

/**
 * Validate that all required string bindings are present and non-empty.
 * D1 and R2 bindings are validated by Cloudflare runtime,
 * so we only check string environment variables here.
 */
export function validateBindings(
  bindings: Bindings,
): Result<Bindings, string> {
  const requiredStrings: (keyof Bindings)[] = [
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "PUBLIC_BUCKET_URL",
  ];

  const missing = requiredStrings.filter(
    (key) => !bindings[key] || (bindings[key] as string).trim() === "",
  );

  if (missing.length > 0) {
    return err(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const placeholders = requiredStrings.filter(
    (key) => (bindings[key] as string).endsWith("_HERE"),
  );

  if (placeholders.length > 0) {
    return err(`Placeholder values not replaced: ${placeholders.join(", ")}`);
  }

  return ok(bindings);
}
