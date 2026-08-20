import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGuestMode } from "@/hooks/useGuestMode";

// The hydration flash: useGuestMode reads localStorage, which is unavailable
// during SSR, so any render branch keyed on isGuest must tolerate the
// server/first-client-render value of false until the mounted guard flips it.
describe("useGuestMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to isGuest=false when localStorage has no guest flag", () => {
    const { result } = renderHook(() => useGuestMode());
    expect(result.current.isGuest).toBe(false);
    expect(result.current.guestData.xp).toBe(0);
  });

  it("picks up an existing guest flag on mount", () => {
    localStorage.setItem("bb_guest_mode", "true");
    const { result } = renderHook(() => useGuestMode());
    expect(result.current.isGuest).toBe(true);
  });

  it("enableGuestMode flips isGuest and persists the flag", () => {
    const { result } = renderHook(() => useGuestMode());

    act(() => {
      result.current.enableGuestMode();
    });

    expect(result.current.isGuest).toBe(true);
    expect(localStorage.getItem("bb_guest_mode")).toBe("true");
    expect(localStorage.getItem("bb_guest_data")).not.toBeNull();
  });

  it("addXP updates guestData and persists it to localStorage", () => {
    const { result } = renderHook(() => useGuestMode());

    act(() => {
      result.current.enableGuestMode();
    });
    act(() => {
      result.current.addXP(50);
    });

    expect(result.current.guestData.xp).toBe(50);
    const persisted = JSON.parse(localStorage.getItem("bb_guest_data")!);
    expect(persisted.xp).toBe(50);
  });

  it("falls back to defaults when bb_guest_data is corrupted JSON", () => {
    localStorage.setItem("bb_guest_mode", "true");
    localStorage.setItem("bb_guest_data", "{not valid json");

    const { result } = renderHook(() => useGuestMode());

    expect(result.current.isGuest).toBe(true);
    expect(result.current.guestData.xp).toBe(0);
  });
});
