import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@clerk/clerk-react", () => ({
  UserButton: () => <div data-testid="clerk-user-button">UserButton</div>,
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
  SignIn: () => <div data-testid="clerk-sign-in">SignIn</div>,
}));

import App from "./App";

describe("App", () => {
  it("should render the app title when authenticated", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    expect(screen.getByText("NekoLog")).toBeInTheDocument();
  });
});
