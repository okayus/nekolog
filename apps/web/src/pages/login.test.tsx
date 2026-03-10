import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
  },
}));

import { authClient } from "../lib/auth-client";
import { LoginPage } from "./login";

const mockedSignInEmail = vi.mocked(authClient.signIn.email);
const mockedSignUpEmail = vi.mocked(authClient.signUp.email);

function renderLoginPage(initialEntries = ["/login"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  it("should display the sign-in form by default", () => {
    renderLoginPage();
    expect(screen.getByText("NekoLog")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("パスワード")).toBeInTheDocument();
    expect(screen.getByText("サインイン")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("名前")).not.toBeInTheDocument();
  });

  it("should switch to sign-up mode", async () => {
    renderLoginPage();
    await userEvent.click(screen.getByText("アカウントをお持ちでない方はこちら"));
    expect(screen.getByPlaceholderText("名前")).toBeInTheDocument();
    expect(screen.getByText("サインアップ")).toBeInTheDocument();
  });

  it("should display error on sign-in failure", async () => {
    mockedSignInEmail.mockResolvedValue({
      error: { message: "メールアドレスまたはパスワードが正しくありません" },
    } as Awaited<ReturnType<typeof authClient.signIn.email>>);

    renderLoginPage();
    await userEvent.type(screen.getByPlaceholderText("メールアドレス"), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText("パスワード"), "wrong");
    await userEvent.click(screen.getByText("サインイン"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "メールアドレスまたはパスワードが正しくありません"
    );
  });

  it("should display error on sign-up failure", async () => {
    mockedSignUpEmail.mockResolvedValue({
      error: { message: "このメールアドレスは既に使用されています" },
    } as Awaited<ReturnType<typeof authClient.signUp.email>>);

    renderLoginPage();
    await userEvent.click(screen.getByText("アカウントをお持ちでない方はこちら"));
    await userEvent.type(screen.getByPlaceholderText("名前"), "Test User");
    await userEvent.type(screen.getByPlaceholderText("メールアドレス"), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText("パスワード"), "password123");
    await userEvent.click(screen.getByText("サインアップ"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "このメールアドレスは既に使用されています"
    );
  });

  it("should display error from location state (ProtectedRoute redirect)", () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/login", state: { error: "Session expired" } }]}
      >
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Session expired");
  });
});
