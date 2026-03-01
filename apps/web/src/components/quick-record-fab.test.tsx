import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QuickRecordFab } from "./quick-record-fab";

describe("QuickRecordFab", () => {
  it("should render a link to /logs", () => {
    render(
      <MemoryRouter>
        <QuickRecordFab />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: "記録する" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/logs");
  });

  it("should have fixed positioning class", () => {
    render(
      <MemoryRouter>
        <QuickRecordFab />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: "記録する" });
    expect(link.className).toContain("fixed");
  });

  it("should be hidden on desktop", () => {
    render(
      <MemoryRouter>
        <QuickRecordFab />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: "記録する" });
    expect(link.classList.contains("md:hidden")).toBe(true);
  });
});
