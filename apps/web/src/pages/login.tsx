import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authClient } from "../lib/auth-client";

type AuthMode = "signIn" | "signUp";

/**
 * ログインページ。サインイン / サインアップ切替フォーム。
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateError = (location.state as { error?: string } | null)?.error;

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(stateError ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signIn") {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message ?? "サインインに失敗しました");
          return;
        }
      } else {
        const result = await authClient.signUp.email({ email, password, name });
        if (result.error) {
          setError(result.error.message ?? "サインアップに失敗しました");
          return;
        }
      }
      navigate("/", { replace: true });
    } catch {
      setError("予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-8 text-3xl font-bold">NekoLog</h1>
      <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
        {error && (
          <div role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {mode === "signUp" && (
          <input
            type="text"
            placeholder="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border px-3 py-2"
            required
          />
        )}
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "処理中..." : mode === "signIn" ? "サインイン" : "サインアップ"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signIn" ? "signUp" : "signIn");
            setError("");
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          {mode === "signIn"
            ? "アカウントをお持ちでない方はこちら"
            : "すでにアカウントをお持ちの方はこちら"}
        </button>
      </form>
    </div>
  );
}
