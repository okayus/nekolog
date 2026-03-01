import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("@clerk/clerk-react", () => ({
  UserButton: () => <div data-testid="clerk-user-button">UserButton</div>,
}));

import { Header } from "./header";

describe("Header", () => {
  it("should render the app title", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("NekoLog")).toBeInTheDocument();
  });

  it("should render the Clerk UserButton for logout", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByTestId("clerk-user-button")).toBeInTheDocument();
  });

  it("should render mobile menu toggle button", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: "メニュー" })
    ).toBeInTheDocument();
  });

  it("should toggle mobile menu when button is clicked", async () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const menuButton = screen.getByRole("button", { name: "メニュー" });
    const mobileNav = screen.getByTestId("mobile-nav");

    // Initially hidden (has "hidden" class but always has "md:hidden")
    expect(mobileNav.classList.contains("hidden")).toBe(true);

    // Click to open — "hidden" removed, "block" added
    await userEvent.click(menuButton);
    expect(mobileNav.classList.contains("hidden")).toBe(false);
    expect(mobileNav.classList.contains("block")).toBe(true);

    // Click to close — "hidden" restored
    await userEvent.click(menuButton);
    expect(mobileNav.classList.contains("hidden")).toBe(true);
  });

  it("should render all navigation links", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getAllByText("猫の管理").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("トイレ記録").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("履歴").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("統計").length).toBeGreaterThanOrEqual(1);
  });
});
