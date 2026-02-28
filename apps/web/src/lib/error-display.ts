/**
 * DomainError からユーザー向けメッセージを取得する。
 * API レスポンスのエラーを表示用テキストに変換する。
 * unknown を受け取っても常に string を返す不変条件を保証する。
 */
export function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object" || !("type" in error)) {
    return "予期しないエラーが発生しました";
  }

  const e = error as Record<string, unknown>;

  switch (e["type"]) {
    case "validation":
      return typeof e["message"] === "string" ? e["message"] : "入力内容に誤りがあります";
    case "not_found":
      return typeof e["resource"] === "string" ? `${e["resource"]}が見つかりません` : "リソースが見つかりません";
    case "unauthorized":
      return typeof e["message"] === "string" ? e["message"] : "認証が必要です";
    case "confirmation_required":
      return "この操作には確認が必要です";
    case "database":
      return "サーバーエラーが発生しました。しばらく経ってから再度お試しください。";
    default:
      return "予期しないエラーが発生しました";
  }
}
