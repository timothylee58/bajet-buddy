import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useBudget } from "@/hooks/useBudget";
import { getBudgetSummary } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getBudgetSummary: vi.fn(),
}));

// Every data-fetching hook returns { data, loading, error } — see CLAUDE.md's
// "Trusting fetch to succeed" rule. This pins that contract for useBudget.
describe("useBudget", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(getBudgetSummary).mockReset();
  });

  it("starts in a loading state with no summary", () => {
    vi.mocked(getBudgetSummary).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBudget());

    expect(result.current.loading).toBe(true);
    expect(result.current.summary).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("resolves with the fetched summary and clears loading", async () => {
    vi.mocked(getBudgetSummary).mockResolvedValue({
      total_income: 3200,
      total_spent: 1200,
      remaining: 2000,
      days_left: 10,
      daily_safe_amount: 200,
    });

    const { result } = renderHook(() => useBudget());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summary?.remaining).toBe(2000);
    expect(result.current.error).toBeNull();
  });

  it("surfaces a fetch failure as an error and falls back to mock data", async () => {
    vi.mocked(getBudgetSummary).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useBudget());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("network down");
    expect(result.current.summary).not.toBeNull();
  });
});
