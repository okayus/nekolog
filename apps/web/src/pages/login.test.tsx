import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@clerk/clerk-react", () => ({
  SignIn: () => <div data-testid="clerk-sign-in">SignIn</div>,
}));

import { LoginPage } from "./login";

describe("LoginPage", () => {
  it("should render the login page with Clerk SignIn component", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("clerk-sign-in")).toBeInTheDocument();
  });

  it("should display the app name", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText("NekoLog")).toBeInTheDocument();
  });
});
