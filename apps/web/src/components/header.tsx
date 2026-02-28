import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

/**
 * アプリケーションヘッダー。タイトルとログアウト用 UserButton を表示する。
 */
export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold">
            NekoLog
          </Link>
          <nav className="flex gap-4">
            <Link to="/cats" className="text-sm hover:underline">
              猫の管理
            </Link>
            <Link to="/logs" className="text-sm hover:underline">
              トイレ記録
            </Link>
          </nav>
        </div>
        <UserButton />
      </div>
    </header>
  );
}
