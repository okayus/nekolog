import { describe, it, expect } from "vitest";
import { getRequiredEnv } from "./env";

describe("getRequiredEnv", () => {
  it("should throw when env var is missing", () => {
    expect(() => getRequiredEnv("VITE_NONEXISTENT_KEY")).toThrow(
      "環境変数 VITE_NONEXISTENT_KEY が設定されていません"
    );
  });
});
