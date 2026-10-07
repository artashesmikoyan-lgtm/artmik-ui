import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "../src/hooks/useReducedMotion";
import { installMatchMedia } from "./test-utils";

const query = "(prefers-reduced-motion: reduce)";

describe("useReducedMotion", () => {
  it("returns false when the platform does not request reduced motion", () => {
    installMatchMedia(false);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it("returns true when reduced motion is requested", () => {
    installMatchMedia(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it("safely defaults to false when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it("updates when the media preference changes", () => {
    const media = installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());

    act(() => media.setReducedMotion(true));

    expect(result.current).toBe(true);
  });

  it("removes the media-query listener on unmount", () => {
    const media = installMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());

    expect(media.listenerCount(query)).toBe(1);
    unmount();

    expect(media.listenerCount(query)).toBe(0);
  });
});
