import { type AuthState, toUserId } from "@nekolog/shared";
import { authClient } from "../lib/auth-client";

export function useAuthState(): AuthState {
  const { data: session, isPending, error } = authClient.useSession();
  if (isPending) return { status: "loading" };
  if (error) return { status: "error", message: error.message ?? "認証エラー" };
  if (!session) return { status: "unauthenticated" };
  return {
    status: "authenticated",
    userId: toUserId(session.user.id),
    email: session.user.email,
  };
}
