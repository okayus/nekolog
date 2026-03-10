import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("../lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

import { authClient } from "../lib/auth-client";
import { useAuthState } from "./use-auth-state";

const mockedUseSession = vi.mocked(authClient.useSession);

describe("useAuthState", () => {
  it("should return loading state when session is pending", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    } as ReturnType<typeof authClient.useSession>);

    const { result } = renderHook(() => useAuthState());
    expect(result.current).toEqual({ status: "loading" });
  });

  it("should return unauthenticated state when no session", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as ReturnType<typeof authClient.useSession>);

    const { result } = renderHook(() => useAuthState());
    expect(result.current).toEqual({ status: "unauthenticated" });
  });

  it("should return authenticated state with user data", () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: { id: "user-123", email: "test@example.com" },
        session: {},
      },
      isPending: false,
      error: null,
    } as ReturnType<typeof authClient.useSession>);

    const { result } = renderHook(() => useAuthState());
    expect(result.current).toEqual({
      status: "authenticated",
      userId: "user-123",
      email: "test@example.com",
    });
  });

  it("should return error state when session fetch fails", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: { message: "Network error" },
    } as ReturnType<typeof authClient.useSession>);

    const { result } = renderHook(() => useAuthState());
    expect(result.current).toEqual({
      status: "error",
      message: "Network error",
    });
  });
});
