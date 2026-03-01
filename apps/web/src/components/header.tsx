import { useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const NAV_LINKS = [
  { to: "/cats", label: "猫の管理" },
  { to: "/logs", label: "トイレ記録" },
  { to: "/history", label: "履歴" },
  { to: "/stats", label: "統計" },
];

/**
 * アプリケーションヘッダー。
 * デスクトップは横並びナビ、モバイルはハンバーガーメニュー。
 */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold">
            NekoLog
          </Link>
          {/* Desktop nav */}
          <nav className="hidden gap-4 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <UserButton />
          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label="メニュー"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded p-2 hover:bg-gray-100 md:hidden"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <nav
        data-testid="mobile-nav"
        className={`border-t md:hidden ${mobileOpen ? "block" : "hidden"}`}
      >
        <div className="container mx-auto flex flex-col gap-1 px-4 py-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="rounded px-3 py-2.5 text-sm hover:bg-gray-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
