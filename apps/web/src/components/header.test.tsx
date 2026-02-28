import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
