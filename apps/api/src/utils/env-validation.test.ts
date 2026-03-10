import { describe, it, expect } from "vitest";
import { validateBindings } from "./env-validation";

describe("validateBindings", () => {
  it("should return ok when all required bindings are present", () => {
    const bindings = {
      DB: {} as D1Database,
      BUCKET: {} as R2Bucket,
      BETTER_AUTH_SECRET: "test-secret",
      BETTER_AUTH_URL: "http://localhost:8787",
      PUBLIC_BUCKET_URL: "https://images.example.com",
    };

    const result = validateBindings(bindings);
    expect(result.isOk()).toBe(true);
  });

  it("should return err when BETTER_AUTH_SECRET is missing", () => {
    const bindings = {
      DB: {} as D1Database,
      BUCKET: {} as R2Bucket,
      BETTER_AUTH_SECRET: "",
      BETTER_AUTH_URL: "http://localhost:8787",
      PUBLIC_BUCKET_URL: "https://images.example.com",
    };

    const result = validateBindings(bindings);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("BETTER_AUTH_SECRET");
    }
  });

  it("should return err when BETTER_AUTH_URL is missing", () => {
    const bindings = {
      DB: {} as D1Database,
      BUCKET: {} as R2Bucket,
      BETTER_AUTH_SECRET: "test-secret",
      BETTER_AUTH_URL: "",
      PUBLIC_BUCKET_URL: "https://images.example.com",
    };

    const result = validateBindings(bindings);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("BETTER_AUTH_URL");
    }
  });

  it("should return err listing all missing bindings", () => {
    const bindings = {
      DB: {} as D1Database,
      BUCKET: {} as R2Bucket,
      BETTER_AUTH_SECRET: "",
      BETTER_AUTH_URL: "",
      PUBLIC_BUCKET_URL: "",
    };

    const result = validateBindings(bindings);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("BETTER_AUTH_SECRET");
      expect(result.error).toContain("BETTER_AUTH_URL");
      expect(result.error).toContain("PUBLIC_BUCKET_URL");
    }
  });
});
