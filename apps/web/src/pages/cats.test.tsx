import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { CatsPage } from "./cats";

function createFetchResponse(data: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

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

describe("CatsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the page title", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({ cats: [] })
    );

    renderWithProviders(<CatsPage />);
    expect(screen.getByText("猫の管理")).toBeInTheDocument();
  });

  it("should show empty state when no cats exist", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({ cats: [] })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("猫が登録されていません")).toBeInTheDocument();
    });
  });

  it("should display cat cards when cats exist", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({
        cats: [
          {
            id: "cat-1",
            name: "たま",
            breed: "スコティッシュフォールド",
            weight: 4.5,
            birthDate: null,
            imageUrl: null,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });
    expect(screen.getByText("スコティッシュフォールド")).toBeInTheDocument();
    expect(screen.getByText("4.5 kg")).toBeInTheDocument();
  });

  it("should show registration form when add button is clicked", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({ cats: [] })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("猫が登録されていません")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "猫を登録" }));
    expect(screen.getByLabelText("名前")).toBeInTheDocument();
  });

  it("should show validation error when submitting empty name", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({ cats: [] })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("猫が登録されていません")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "猫を登録" }));
    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(screen.getByText("名前は必須です")).toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    // First call: fetchCats (GET)
    fetchSpy.mockReturnValueOnce(createFetchResponse({ cats: [] }));
    // Second call: createCat (POST)
    fetchSpy.mockReturnValueOnce(
      createFetchResponse(
        {
          cat: {
            id: "cat-new",
            name: "みけ",
            breed: null,
            weight: null,
            birthDate: null,
            imageUrl: null,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        },
        201
      )
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("猫が登録されていません")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "猫を登録" }));
    await userEvent.type(screen.getByLabelText("名前"), "みけ");
    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/cats",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("should show API error on form submit failure", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockReturnValueOnce(createFetchResponse({ cats: [] }));
    fetchSpy.mockReturnValueOnce(
      createFetchResponse(
        { type: "validation", field: "name", message: "名前は必須です" },
        400
      )
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("猫が登録されていません")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "猫を登録" }));
    await userEvent.type(screen.getByLabelText("名前"), "a");
    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(screen.getByText("名前は必須です")).toBeInTheDocument();
    });
  });

  // === Task 8.2: 猫編集・削除機能 ===

  it("should show edit button on cat card", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({
        cats: [
          {
            id: "cat-1",
            name: "たま",
            breed: null,
            weight: null,
            birthDate: null,
            imageUrl: null,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument();
  });

  it("should show delete button on cat card", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({
        cats: [
          {
            id: "cat-1",
            name: "たま",
            breed: null,
            weight: null,
            birthDate: null,
            imageUrl: null,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
  });

  it("should show edit form when edit button is clicked", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({
        cats: [
          {
            id: "cat-1",
            name: "たま",
            breed: "スコティッシュフォールド",
            weight: 4.5,
            birthDate: null,
            imageUrl: null,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "編集" }));
    expect(screen.getByLabelText("名前")).toBeInTheDocument();
    expect(screen.getByDisplayValue("たま")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("スコティッシュフォールド")
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("4.5")).toBeInTheDocument();
  });

  it("should submit edit form with PUT request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockReturnValue(
      createFetchResponse({
        cats: [
          {
            id: "cat-1",
            name: "たま",
            breed: null,
            weight: null,
            birthDate: null,
            imageUrl: null,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "編集" }));

    // updateCat (PUT) response
    fetchSpy.mockReturnValueOnce(
      createFetchResponse({
        cat: {
          id: "cat-1",
          name: "たまちゃん",
          breed: null,
          weight: null,
          birthDate: null,
          imageUrl: null,
          userId: "user-1",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      })
    );

    const nameInput = screen.getByLabelText("名前");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "たまちゃん");
    await userEvent.click(screen.getByRole("button", { name: "更新" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/cats/cat-1",
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  it("should show delete confirmation dialog", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({
        cats: [
          {
            id: "cat-1",
            name: "たま",
            breed: null,
            weight: null,
            birthDate: null,
            imageUrl: null,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "削除" }));
    expect(
      screen.getByText("「たま」を削除しますか？")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "関連するトイレ記録もすべて削除されます。この操作は取り消せません。"
      )
    ).toBeInTheDocument();
  });

  it("should cancel delete when cancel button is clicked", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      createFetchResponse({
        cats: [
          {
            id: "cat-1",
            name: "たま",
            breed: null,
            weight: null,
            birthDate: null,
            imageUrl: null,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "削除" }));
    expect(
      screen.getByText("「たま」を削除しますか？")
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(
      screen.queryByText("「たま」を削除しますか？")
    ).not.toBeInTheDocument();
  });

  it("should send DELETE request with confirmed=true when confirmed", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockReturnValue(
      createFetchResponse({
        cats: [
          {
            id: "cat-1",
            name: "たま",
            breed: null,
            weight: null,
            birthDate: null,
            imageUrl: null,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "削除" }));

    // DELETE response
    fetchSpy.mockReturnValueOnce(createFetchResponse({ success: true }));

    await userEvent.click(
      screen.getByRole("button", { name: "削除する" })
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/cats/cat-1?confirmed=true",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("should show confirmation_required error on delete without confirmation", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockReturnValue(
      createFetchResponse({
        cats: [
          {
            id: "cat-1",
            name: "たま",
            breed: null,
            weight: null,
            birthDate: null,
            imageUrl: null,
            userId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      })
    );

    renderWithProviders(<CatsPage />);
    await waitFor(() => {
      expect(screen.getByText("たま")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "削除" }));

    // DELETE returns confirmation_required error
    fetchSpy.mockReturnValueOnce(
      createFetchResponse({ type: "confirmation_required" }, 422)
    );

    await userEvent.click(
      screen.getByRole("button", { name: "削除する" })
    );

    await waitFor(() => {
      expect(
        screen.getByText("この操作には確認が必要です")
      ).toBeInTheDocument();
    });
  });
});
