import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthState } from "../hooks/use-auth-state";

/**
 * 認証済みユーザーのみアクセスを許可するルートラッパー。
 * 未認証の場合は /login にリダイレクトする。
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const authState = useAuthState();

  switch (authState.status) {
    case "loading":
      return null;
    case "unauthenticated":
      return <Navigate to="/login" replace />;
    case "error":
      return <Navigate to="/login" replace state={{ error: authState.message }} />;
    case "authenticated":
      return <>{children}</>;
  }
}
