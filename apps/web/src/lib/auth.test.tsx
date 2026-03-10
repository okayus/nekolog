import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../hooks/use-auth-state", () => ({
  useAuthState: vi.fn(),
}));

import { useAuthState } from "../hooks/use-auth-state";
import { ProtectedRoute } from "./auth";

const mockedUseAuthState = vi.mocked(useAuthState);

function renderWithRouter(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("should render children when authenticated", () => {
    mockedUseAuthState.mockReturnValue({
      status: "authenticated",
      userId: "user-123" as ReturnType<typeof useAuthState> extends { userId: infer U } ? U : never,
      email: "test@example.com",
    } as ReturnType<typeof useAuthState>);

    renderWithRouter(["/dashboard"]);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("should redirect to /login when not authenticated", () => {
    mockedUseAuthState.mockReturnValue({ status: "unauthenticated" });

    renderWithRouter(["/dashboard"]);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should show loading state while auth is loading", () => {
    mockedUseAuthState.mockReturnValue({ status: "loading" });

    renderWithRouter(["/dashboard"]);
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("should redirect to /login with error state on error", () => {
    mockedUseAuthState.mockReturnValue({
      status: "error",
      message: "Session expired",
    });

    renderWithRouter(["/dashboard"]);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});
