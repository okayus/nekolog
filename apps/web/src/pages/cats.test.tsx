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
});
