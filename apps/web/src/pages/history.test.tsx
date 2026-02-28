import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { HistoryPage } from "./history";

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
const LOG_ID_1 = "b0000000-0000-4000-a000-000000000001";
const LOG_ID_2 = "b0000000-0000-4000-a000-000000000002";
const LOG_ID_3 = "b0000000-0000-4000-a000-000000000003";

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

const MOCK_LOGS = {
  logs: [
    {
      id: LOG_ID_1,
      catId: CAT_ID_1,
      type: "urine" as const,
      timestamp: "2024-01-15T10:00:00Z",
      note: null,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: LOG_ID_2,
      catId: CAT_ID_1,
      type: "feces" as const,
      timestamp: "2024-01-15T08:00:00Z",
      note: "少し柔らかい",
      createdAt: "2024-01-15T08:00:00Z",
      updatedAt: "2024-01-15T08:00:00Z",
    },
    {
      id: LOG_ID_3,
      catId: CAT_ID_2,
      type: "urine" as const,
      timestamp: "2024-01-14T20:00:00Z",
      note: null,
      createdAt: "2024-01-14T20:00:00Z",
      updatedAt: "2024-01-14T20:00:00Z",
    },
  ],
  total: 3,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const MOCK_EMPTY_LOGS = {
  logs: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
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

/**
 * URL ベースで fetch をモックするヘルパー。
 */
function mockFetch(overrides?: {
  logs?: { data: unknown; status?: number };
  cats?: { data: unknown; status?: number };
  put?: { data: unknown; status?: number };
  delete?: { data: unknown; status?: number };
}) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(
      (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.startsWith("/api/logs") && init?.method === "PUT" && overrides?.put) {
          return createFetchResponse(
            overrides.put.data,
            overrides.put.status ?? 200
          );
        }

        if (url.startsWith("/api/logs") && init?.method === "DELETE" && overrides?.delete) {
          return createFetchResponse(
            overrides.delete.data,
            overrides.delete.status ?? 200
          );
        }

        if (url.startsWith("/api/logs")) {
          const logsData = overrides?.logs?.data ?? MOCK_LOGS;
          const logsStatus = overrides?.logs?.status ?? 200;
          return createFetchResponse(logsData, logsStatus);
        }

        if (url === "/api/cats") {
          const catsData = overrides?.cats?.data ?? { cats: MOCK_CATS };
          const catsStatus = overrides?.cats?.status ?? 200;
          return createFetchResponse(catsData, catsStatus);
        }

        return createFetchResponse({});
      }
    );
}

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the page title", async () => {
    mockFetch();
    renderWithProviders(<HistoryPage />);
    expect(screen.getByText("トイレ記録履歴")).toBeInTheDocument();
  });

  it("should display log entries in a list", async () => {
    mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("排尿")).toBeInTheDocument();
    });
    expect(screen.getByText("排便")).toBeInTheDocument();
  });

  it("should display cat names for each log entry", async () => {
    mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getAllByText("たま").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText("みけ").length).toBeGreaterThanOrEqual(1);
  });

  it("should display log notes when present", async () => {
    mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("少し柔らかい")).toBeInTheDocument();
    });
  });

  it("should show empty state when no logs exist", async () => {
    mockFetch({ logs: { data: MOCK_EMPTY_LOGS } });
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("記録がありません")).toBeInTheDocument();
    });
  });

  it("should show cat filter dropdown", async () => {
    mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByLabelText("猫で絞り込み")).toBeInTheDocument();
    });
  });

  it("should show type filter dropdown", async () => {
    mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByLabelText("種類で絞り込み")).toBeInTheDocument();
    });
  });

  it("should filter logs by cat", async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      const select = screen.getByLabelText("猫で絞り込み") as unknown as HTMLSelectElement;
      expect(select.options.length).toBeGreaterThan(1);
    });

    await userEvent.selectOptions(screen.getByLabelText("猫で絞り込み"), "たま");

    await waitFor(() => {
      const logsCall = fetchSpy.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("/api/logs") && call[0].includes("catId=")
      );
      expect(logsCall).toBeDefined();
      expect((logsCall![0] as string)).toContain(`catId=${CAT_ID_1}`);
    });
  });

  it("should filter logs by type", async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByLabelText("種類で絞り込み")).toBeInTheDocument();
    });

    await userEvent.selectOptions(screen.getByLabelText("種類で絞り込み"), "排尿");

    await waitFor(() => {
      const logsCall = fetchSpy.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("/api/logs") && call[0].includes("type=urine")
      );
      expect(logsCall).toBeDefined();
    });
  });

  it("should show pagination when multiple pages exist", async () => {
    mockFetch({
      logs: {
        data: {
          ...MOCK_LOGS,
          total: 40,
          totalPages: 2,
        },
      },
    });
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("次へ")).toBeInTheDocument();
    });
  });

  it("should navigate to next page", async () => {
    const fetchSpy = mockFetch({
      logs: {
        data: {
          ...MOCK_LOGS,
          total: 40,
          totalPages: 2,
        },
      },
    });
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("次へ")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("次へ"));

    await waitFor(() => {
      const pageCall = fetchSpy.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("page=2")
      );
      expect(pageCall).toBeDefined();
    });
  });

  it("should disable prev button on first page", async () => {
    mockFetch({
      logs: {
        data: {
          ...MOCK_LOGS,
          total: 40,
          totalPages: 2,
        },
      },
    });
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("前へ")).toBeInTheDocument();
    });
    expect(screen.getByText("前へ")).toBeDisabled();
  });

  it("should show edit button for each log entry", async () => {
    mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "編集" }).length).toBe(3);
    });
  });

  it("should show delete button for each log entry", async () => {
    mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "削除" }).length).toBe(3);
    });
  });

  it("should open edit form when edit button is clicked", async () => {
    mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "編集" })[0]!).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByRole("button", { name: "編集" })[0]!);

    await waitFor(() => {
      expect(screen.getByText("記録を編集")).toBeInTheDocument();
    });
  });

  it("should submit log update", async () => {
    const fetchSpy = mockFetch({
      put: {
        data: {
          log: {
            ...MOCK_LOGS.logs[0],
            note: "更新メモ",
          },
        },
      },
    });
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "編集" })[0]!).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByRole("button", { name: "編集" })[0]!);

    await waitFor(() => {
      expect(screen.getByText("記録を編集")).toBeInTheDocument();
    });

    const noteInput = screen.getByLabelText("メモ");
    await userEvent.clear(noteInput);
    await userEvent.type(noteInput, "更新メモ");
    await userEvent.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(`/api/logs/${LOG_ID_1}`),
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  it("should submit note as empty string when clearing existing note", async () => {
    const fetchSpy = mockFetch({
      put: {
        data: {
          log: {
            ...MOCK_LOGS.logs[1],
            note: "",
          },
        },
      },
    });
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "編集" })[1]!).toBeInTheDocument();
    });

    // Edit the second log (which has note "少し柔らかい")
    await userEvent.click(screen.getAllByRole("button", { name: "編集" })[1]!);
    await waitFor(() => {
      expect(screen.getByText("記録を編集")).toBeInTheDocument();
    });

    const noteInput = screen.getByLabelText("メモ");
    await userEvent.clear(noteInput);
    await userEvent.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      const putCall = fetchSpy.mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("/api/logs/") &&
          (call[1] as RequestInit)?.method === "PUT"
      );
      expect(putCall).toBeDefined();
      const body = JSON.parse((putCall![1] as RequestInit).body as string);
      expect(body).toHaveProperty("note", "");
    });
  });

  it("should show delete confirmation dialog", async () => {
    mockFetch();
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "削除" })[0]!).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByRole("button", { name: "削除" })[0]!);

    await waitFor(() => {
      expect(screen.getByText("この記録を削除しますか？")).toBeInTheDocument();
    });
  });

  it("should delete log on confirmation", async () => {
    const fetchSpy = mockFetch({
      delete: { data: { success: true } },
    });
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "削除" })[0]!).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByRole("button", { name: "削除" })[0]!);
    await waitFor(() => {
      expect(screen.getByText("この記録を削除しますか？")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(`/api/logs/${LOG_ID_1}?confirmed=true`),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("should show error when log fetch fails", async () => {
    mockFetch({
      logs: {
        data: { type: "database", message: "DB error" },
        status: 500,
      },
    });
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("should show page info with current/total pages", async () => {
    mockFetch({
      logs: {
        data: {
          ...MOCK_LOGS,
          total: 40,
          page: 1,
          totalPages: 2,
        },
      },
    });
    renderWithProviders(<HistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("1 / 2 ページ")).toBeInTheDocument();
    });
  });
});
