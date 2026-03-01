import { useOnlineStatus } from "../hooks/use-online-status";

/**
 * オフライン時に画面上部に警告バナーを表示するコンポーネント。
 * オンライン時は何もレンダリングしない。
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="alert"
      className="bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-white"
    >
      オフラインです。インターネット接続を確認してください。
    </div>
  );
}
