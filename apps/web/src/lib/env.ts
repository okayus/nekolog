/**
 * 必須の環境変数を取得する。
 * 未設定または空文字の場合はエラーを throw する。
 */
export function getRequiredEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  return value;
}
