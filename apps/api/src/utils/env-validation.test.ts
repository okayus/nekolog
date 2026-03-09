import { describe, it, expect } from "vitest";
import { validateBindings } from "./env-validation";

describe("validateBindings", () => {
  it("should return ok when all required bindings are present", () => {
    const bindings = {
      DB: {} as D1Database,
      BUCKET: {} as R2Bucket,
      CLERK_SECRET_KEY: "sk_test_xxx",
      CLERK_PUBLISHABLE_KEY: "pk_test_xxx",
      PUBLIC_BUCKET_URL: "https://images.example.com",
    };

    const result = validateBindings(bindings);
    expect(result.isOk()).toBe(true);
  });

  it("should return err when CLERK_SECRET_KEY is missing", () => {
    const bindings = {
      DB: {} as D1Database,
      BUCKET: {} as R2Bucket,
      CLERK_SECRET_KEY: "",
      CLERK_PUBLISHABLE_KEY: "pk_test_xxx",
      PUBLIC_BUCKET_URL: "https://images.example.com",
    };

    const result = validateBindings(bindings);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("CLERK_SECRET_KEY");
    }
  });

  it("should return err when CLERK_PUBLISHABLE_KEY is missing", () => {
    const bindings = {
      DB: {} as D1Database,
      BUCKET: {} as R2Bucket,
      CLERK_SECRET_KEY: "sk_test_xxx",
      CLERK_PUBLISHABLE_KEY: "",
      PUBLIC_BUCKET_URL: "https://images.example.com",
    };

    const result = validateBindings(bindings);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("CLERK_PUBLISHABLE_KEY");
    }
  });

  it("should return err listing all missing bindings", () => {
    const bindings = {
      DB: {} as D1Database,
      BUCKET: {} as R2Bucket,
      CLERK_SECRET_KEY: "",
      CLERK_PUBLISHABLE_KEY: "",
      PUBLIC_BUCKET_URL: "",
    };

    const result = validateBindings(bindings);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("CLERK_SECRET_KEY");
      expect(result.error).toContain("CLERK_PUBLISHABLE_KEY");
      expect(result.error).toContain("PUBLIC_BUCKET_URL");
    }
  });
});
