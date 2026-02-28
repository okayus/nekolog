import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { LogsPage } from "./logs";

function createFetchResponse(data: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

const CAT_ID_1 = "a0000000-0000-4000-a000-000000000001";

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
    id: "a0000000-0000-4000-a000-000000000002",
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

const MOCK_LOG_RESPONSE = {
  log: {
    id: "log-1",
    catId: CAT_ID_1,
    type: "urine",
    timestamp: "2024-01-01T12:00:00Z",
    note: null,
    createdAt: "2024-01-01T12:00:00Z",
    updatedAt: "2024-01-01T12:00:00Z",
  },
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
function mockFetchWithCats(
  postResponse?: { data: unknown; status?: number }
) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(
      (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "/api/logs" && init?.method === "POST" && postResponse) {
          return createFetchResponse(
            postResponse.data,
            postResponse.status ?? 201
          );
        }
        return createFetchResponse({ cats: MOCK_CATS });
      }
    );
}

/** 猫を選択してフォームを送信するヘルパー */
async function selectCatAndSubmit(catName = "たま") {
  await userEvent.selectOptions(screen.getByLabelText("猫を選択"), catName);
  await userEvent.click(screen.getByRole("button", { name: "記録する" }));
}

describe("LogsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the page title", async () => {
    mockFetchWithCats();

    renderWithProviders(<LogsPage />);
    expect(screen.getByText("トイレ記録")).toBeInTheDocument();
  });

  it("should show cat selection dropdown", async () => {
    mockFetchWithCats();

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByLabelText("猫を選択")).toBeInTheDocument();
    });
  });

  it("should populate cat dropdown with fetched cats", async () => {
    mockFetchWithCats();

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      const select = screen.getByLabelText("猫を選択") as unknown as HTMLSelectElement;
      expect(select.options.length).toBe(3); // placeholder + 2 cats
    });
    expect(screen.getByText("たま")).toBeInTheDocument();
    expect(screen.getByText("みけ")).toBeInTheDocument();
  });

  it("should show toilet type toggle buttons", async () => {
    mockFetchWithCats();

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "排尿" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "排便" })).toBeInTheDocument();
  });

  it("should toggle toilet type selection", async () => {
    mockFetchWithCats();

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "排尿" })).toBeInTheDocument();
    });

    const fecesButton = screen.getByRole("button", { name: "排便" });
    await userEvent.click(fecesButton);

    expect(fecesButton.className).toContain("bg-amber-600");
  });

  it("should show datetime input", async () => {
    mockFetchWithCats();

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByLabelText("日時")).toBeInTheDocument();
    });
  });

  it("should show note input", async () => {
    mockFetchWithCats();

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByLabelText("メモ")).toBeInTheDocument();
    });
  });

  it("should show validation error when no cat is selected", async () => {
    mockFetchWithCats();

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "記録する" }));

    await waitFor(() => {
      expect(
        screen.getByText("有効な猫IDを指定してください")
      ).toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    const fetchSpy = mockFetchWithCats({
      data: MOCK_LOG_RESPONSE,
      status: 201,
    });

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await selectCatAndSubmit();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/logs",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("should show success message after successful submission", async () => {
    mockFetchWithCats({ data: MOCK_LOG_RESPONSE, status: 201 });

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await selectCatAndSubmit();

    await waitFor(() => {
      expect(screen.getByText("記録しました")).toBeInTheDocument();
    });
  });

  it("should show API error on submit failure", async () => {
    mockFetchWithCats({
      data: { type: "not_found", resource: "Cat", id: CAT_ID_1 },
      status: 404,
    });

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await selectCatAndSubmit();

    await waitFor(() => {
      expect(screen.getByText("Catが見つかりません")).toBeInTheDocument();
    });
  });

  it("should submit with note when provided", async () => {
    const fetchSpy = mockFetchWithCats({
      data: MOCK_LOG_RESPONSE,
      status: 201,
    });

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await userEvent.selectOptions(screen.getByLabelText("猫を選択"), "たま");
    await userEvent.type(screen.getByLabelText("メモ"), "少し血が混じっていた");
    await userEvent.click(screen.getByRole("button", { name: "記録する" }));

    await waitFor(() => {
      const postCall = fetchSpy.mock.calls.find(
        (call) => call[0] === "/api/logs"
      );
      expect(postCall).toBeDefined();
      const body = JSON.parse((postCall![1] as RequestInit).body as string);
      expect(body.note).toBe("少し血が混じっていた");
    });
  });

  it("should show empty state when no cats exist", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({ cats: [] })
    );

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(
        screen.getByText("猫が登録されていません。先に猫を登録してください。")
      ).toBeInTheDocument();
    });
  });

  it("should show error when cat fetch fails instead of empty state", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse(
        { type: "database", message: "DB error" },
        500
      )
    );

    renderWithProviders(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(
      screen.queryByText(
        "猫が登録されていません。先に猫を登録してください。"
      )
    ).not.toBeInTheDocument();
  });
});
