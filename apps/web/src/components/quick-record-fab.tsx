import { Link } from "react-router-dom";

/**
 * モバイル用クイック記録 FAB（Floating Action Button）。
 * 画面右下に固定表示し、タップでトイレ記録ページへ遷移する。
 * デスクトップ（md 以上）では非表示。
 */
export function QuickRecordFab() {
  return (
    <Link
      to="/logs"
      aria-label="記録する"
      className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:hidden"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </svg>
    </Link>
  );
}
