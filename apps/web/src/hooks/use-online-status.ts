import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

/**
 * ブラウザのオンライン/オフライン状態を監視するフック。
 * `online`/`offline` イベントに応じてリアクティブに更新される。
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
