import { describe, it, expect } from "vitest";
import { getErrorMessage } from "./error-display";

describe("getErrorMessage", () => {
  it("should return field-specific message for validation error", () => {
    const error = { type: "validation" as const, field: "name", message: "名前は必須です" };
    expect(getErrorMessage(error)).toBe("名前は必須です");
  });

  it("should return resource message for not_found error", () => {
    const error = { type: "not_found" as const, resource: "cat", id: "abc-123" };
    expect(getErrorMessage(error)).toBe("catが見つかりません");
  });

  it("should return auth message for unauthorized error", () => {
    const error = { type: "unauthorized" as const, message: "認証が必要です" };
    expect(getErrorMessage(error)).toBe("認証が必要です");
  });

  it("should return confirmation message for confirmation_required error", () => {
    const error = { type: "confirmation_required" as const };
    expect(getErrorMessage(error)).toBe("この操作には確認が必要です");
  });

  it("should return generic message for database error", () => {
    const error = { type: "database" as const, message: "Server error" };
    expect(getErrorMessage(error)).toBe("サーバーエラーが発生しました。しばらく経ってから再度お試しください。");
  });

  it("should return generic message for unknown error shape", () => {
    expect(getErrorMessage(null)).toBe("予期しないエラーが発生しました");
    expect(getErrorMessage(undefined)).toBe("予期しないエラーが発生しました");
    expect(getErrorMessage("string error")).toBe("予期しないエラーが発生しました");
  });
});
