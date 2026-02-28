import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

/**
 * アプリケーションヘッダー。タイトルとログアウト用 UserButton を表示する。
 */
export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-bold">
          NekoLog
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
