import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { QueryProvider } from "./query-client";

function TestComponent() {
  const { status } = useQuery({
    queryKey: ["test"],
    queryFn: () => Promise.resolve("ok"),
  });
  return <div data-testid="status">{status}</div>;
}

describe("QueryProvider", () => {
  it("should provide QueryClient to children", () => {
    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    );
    // useQuery works without error, status is either pending or success
    const el = screen.getByTestId("status");
    expect(["pending", "success"]).toContain(el.textContent);
  });
});
