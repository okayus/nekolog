import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="chart-line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

import { StatsPage } from "./stats";

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

const MOCK_CATS = [
  {
    id: CAT_ID_1,
    name: "たま",
    breed: null,
    weight: null,
    birthDate: null,
    imageUrl: null,
    userId: "user-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: CAT_ID_2,
    name: "みけ",
    breed: null,
    weight: null,
    birthDate: null,
    imageUrl: null,
    userId: "user-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

const MOCK_CHART_DATA = {
  catId: null,
  catName: null,
  period: "daily" as const,
  data: [
    { date: "2024-01-13", urineCount: 4, fecesCount: 2, totalCount: 6 },
    { date: "2024-01-14", urineCount: 3, fecesCount: 1, totalCount: 4 },
    { date: "2024-01-15", urineCount: 5, fecesCount: 2, totalCount: 7 },
  ],
};

const MOCK_EMPTY_CHART_DATA = {
  catId: null,
  catName: null,
  period: "daily" as const,
  data: [],
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
  chart?: { data: unknown; status?: number };
  cats?: { data: unknown; status?: number };
}) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(
      (input: string | URL | Request) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.startsWith("/api/stats/chart")) {
          const data = overrides?.chart?.data ?? MOCK_CHART_DATA;
          const status = overrides?.chart?.status ?? 200;
          return createFetchResponse(data, status);
        }

        if (url === "/api/cats") {
          const data = overrides?.cats?.data ?? { cats: MOCK_CATS };
          const status = overrides?.cats?.status ?? 200;
          return createFetchResponse(data, status);
        }

        return createFetchResponse({});
      }
    );
}

describe("StatsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the page title", async () => {
    mockFetch();
    renderWithProviders(<StatsPage />);
    expect(screen.getByText("統計")).toBeInTheDocument();
  });

  it("should show period selector with three options", async () => {
    mockFetch();
    renderWithProviders(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "日別" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "週別" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "月別" })).toBeInTheDocument();
  });

  it("should show cat filter dropdown", async () => {
    mockFetch();
    renderWithProviders(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByLabelText("猫で絞り込み")).toBeInTheDocument();
    });
  });

  it("should render chart when data is loaded", async () => {
    mockFetch();
    renderWithProviders(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });
  });

  it("should switch period when clicking period button", async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "週別" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "週別" }));

    await waitFor(() => {
      const chartCall = fetchSpy.mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("/api/stats/chart") &&
          call[0].includes("period=week")
      );
      expect(chartCall).toBeDefined();
    });
  });

  it("should filter by cat when selecting from dropdown", async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(<StatsPage />);
    await waitFor(() => {
      const select = screen.getByLabelText("猫で絞り込み") as unknown as HTMLSelectElement;
      expect(select.options.length).toBeGreaterThan(1);
    });

    await userEvent.selectOptions(screen.getByLabelText("猫で絞り込み"), "たま");

    await waitFor(() => {
      const chartCall = fetchSpy.mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("/api/stats/chart") &&
          call[0].includes(`catId=${CAT_ID_1}`)
      );
      expect(chartCall).toBeDefined();
    });
  });

  it("should show empty state when no chart data", async () => {
    mockFetch({ chart: { data: MOCK_EMPTY_CHART_DATA } });
    renderWithProviders(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByText("データがありません")).toBeInTheDocument();
    });
  });

  it("should show error when chart API fails", async () => {
    mockFetch({
      chart: {
        data: { type: "database", message: "DB error" },
        status: 500,
      },
    });
    renderWithProviders(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("should highlight active period button", async () => {
    mockFetch();
    renderWithProviders(<StatsPage />);
    await waitFor(() => {
      const todayBtn = screen.getByRole("button", { name: "日別" });
      expect(todayBtn.className).toContain("bg-blue-600");
    });
  });

  it("should show chart lines for urine and feces", async () => {
    mockFetch();
    renderWithProviders(<StatsPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId("chart-line").length).toBeGreaterThanOrEqual(2);
    });
  });
});
