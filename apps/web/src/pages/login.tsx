import { SignIn } from "@clerk/clerk-react";

/**
 * ログインページ。Clerk の SignIn コンポーネントを表示する。
 */
export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-8 text-3xl font-bold">NekoLog</h1>
      <SignIn routing="hash" />
    </div>
  );
}
