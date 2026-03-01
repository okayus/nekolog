import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfflineBanner } from "./offline-banner";

// Mock the hook
vi.mock("../hooks/use-online-status", () => ({
  useOnlineStatus: vi.fn(),
}));

import { useOnlineStatus } from "../hooks/use-online-status";
const mockUseOnlineStatus = vi.mocked(useOnlineStatus);

describe("OfflineBanner", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should show banner when offline", () => {
    mockUseOnlineStatus.mockReturnValue(false);

    render(<OfflineBanner />);

    expect(
      screen.getByRole("alert")
    ).toBeInTheDocument();
    expect(screen.getByText(/オフライン/)).toBeInTheDocument();
  });

  it("should not show banner when online", () => {
    mockUseOnlineStatus.mockReturnValue(true);

    render(<OfflineBanner />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should have appropriate styling for visibility", () => {
    mockUseOnlineStatus.mockReturnValue(false);

    render(<OfflineBanner />);

    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("bg-yellow");
  });
});
