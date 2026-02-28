import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./dashboard";

function createFetchResponse(data: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

const CAT_ID_1 = "a0000000-0000-4000-a000-000000000001";
const CAT_ID_2 = "a0000000-0000-4000-a000-000000000002";

const MOCK_SUMMARY = {
  date: "2024-01-15",
  cats: [
    {
      catId: CAT_ID_1,
      catName: "たま",
      urineCount: 3,
      fecesCount: 1,
      totalCount: 4,
    },
    {
      catId: CAT_ID_2,
      catName: "みけ",
      urineCount: 2,
      fecesCount: 0,
      totalCount: 2,
    },
  ],
  totalUrineCount: 5,
  totalFecesCount: 1,
  totalCount: 6,
};

const MOCK_EMPTY_SUMMARY = {
  date: "2024-01-15",
  cats: [],
  totalUrineCount: 0,
  totalFecesCount: 0,
  totalCount: 0,
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

function mockFetch(overrides?: {
  summary?: { data: unknown; status?: number };
}) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(
      (input: string | URL | Request) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.startsWith("/api/stats/summary")) {
          const data = overrides?.summary?.data ?? MOCK_SUMMARY;
          const status = overrides?.summary?.status ?? 200;
          return createFetchResponse(data, status);
        }

        return createFetchResponse({});
      }
    );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the page title", async () => {
    mockFetch();
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
  });

  it("should display total counts for today", async () => {
    mockFetch();
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // 合計: 6, 排尿: 5, 排便: 1 がそれぞれ表示される
      const totals = screen.getByTestId("total-summary");
      expect(totals.textContent).toContain("6");
      expect(totals.textContent).toContain("5");
      expect(totals.textContent).toContain("1");
    });
  });

  it("should display per-cat summary cards", async () => {
    mockFetch();
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });
    expect(screen.getByText("みけ")).toBeInTheDocument();
  });

  it("should display per-cat urine and feces counts", async () => {
    mockFetch();
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    // たま: urine 3, feces 1
    const tamaCard = screen.getByText("たま").closest("[data-testid]")!;
    expect(tamaCard).toBeInTheDocument();
    expect(tamaCard.textContent).toContain("3");
    expect(tamaCard.textContent).toContain("1");

    // みけ: urine 2, feces 0
    const mikeCard = screen.getByText("みけ").closest("[data-testid]")!;
    expect(mikeCard).toBeInTheDocument();
    expect(mikeCard.textContent).toContain("2");
    expect(mikeCard.textContent).toContain("0");
  });

  it("should show empty state when no cats exist", async () => {
    mockFetch({ summary: { data: MOCK_EMPTY_SUMMARY } });
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(
        screen.getByText("猫が登録されていません")
      ).toBeInTheDocument();
    });
  });

  it("should show error when API fails", async () => {
    mockFetch({
      summary: {
        data: { type: "database", message: "DB error" },
        status: 500,
      },
    });
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("should display today's date", async () => {
    mockFetch();
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("2024-01-15")).toBeInTheDocument();
    });
  });

  it("should show labels for urine and feces in summary", async () => {
    mockFetch();
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("排尿")).toBeInTheDocument();
    });
    expect(screen.getByText("排便")).toBeInTheDocument();
  });
});
