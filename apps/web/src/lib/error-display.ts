import type { DomainError } from "@nekolog/shared";

/**
 * DomainError からユーザー向けメッセージを取得する。
 * API レスポンスのエラーを表示用テキストに変換する。
 */
export function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object" || !("type" in error)) {
    return "予期しないエラーが発生しました";
  }

  const domainError = error as DomainError;

  switch (domainError.type) {
    case "validation":
      return domainError.message;
    case "not_found":
      return `${domainError.resource}が見つかりません`;
    case "unauthorized":
      return domainError.message;
    case "confirmation_required":
      return "この操作には確認が必要です";
    case "database":
      return "サーバーエラーが発生しました。しばらく経ってから再度お試しください。";
    default:
      return "予期しないエラーが発生しました";
  }
}
