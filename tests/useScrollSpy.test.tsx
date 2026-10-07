import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useScrollSpy } from "../src/hooks/useScrollSpy";
import { installIntersectionObserver, MockIntersectionObserver } from "./test-utils";

function ActiveSection({ ids }: { ids: readonly string[] }) {
  const activeId = useScrollSpy(ids, { rootMargin: "12px", threshold: [0, 0.5] });
  return <output>{activeId ?? "none"}</output>;
}

describe("useScrollSpy", () => {
  it("accepts arbitrary section IDs and initializes from the supplied configuration", () => {
    installIntersectionObserver();
    render(
      <>
        <section id="intro" />
        <section id="case-study" />
        <ActiveSection ids={["intro", "case-study"]} />
      </>,
    );

    expect(screen.getByRole("status", { hidden: true })).toBeDefined();
    expect(screen.getByText("intro")).toBeDefined();
    expect(MockIntersectionObserver.instances[0]?.rootMargin).toBe("12px");
    expect(MockIntersectionObserver.instances[0]?.thresholds).toEqual([0, 0.5]);
  });

  it("observes only existing sections", () => {
    installIntersectionObserver();
    const { container } = render(
      <>
        <section id="available" />
        <ActiveSection ids={["missing", "available"]} />
      </>,
    );
    const observer = MockIntersectionObserver.instances[0];

    expect(observer?.observe).toHaveBeenCalledTimes(1);
    expect(observer?.observe).toHaveBeenCalledWith(container.querySelector("#available"));
  });

  it("updates the active section when an observed section intersects", () => {
    installIntersectionObserver();
    const { container } = render(
      <>
        <section id="intro" />
        <section id="case-study" />
        <ActiveSection ids={["intro", "case-study"]} />
      </>,
    );
    const observer = MockIntersectionObserver.instances[0];

    act(() => observer?.trigger([{ target: container.querySelector("#case-study")!, isIntersecting: true }]));

    expect(screen.getByText("case-study")).toBeDefined();
  });

  it("chooses the section nearest the active line when multiple sections intersect", () => {
    installIntersectionObserver();
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
    const { container } = render(
      <>
        <section id="earlier" />
        <section id="nearer" />
        <ActiveSection ids={["earlier", "nearer"]} />
      </>,
    );
    const earlier = container.querySelector("#earlier")!;
    const nearer = container.querySelector("#nearer")!;
    vi.spyOn(earlier, "getBoundingClientRect").mockReturnValue({
      top: 100, bottom: 500, left: 0, right: 100, width: 100, height: 400, x: 0, y: 100, toJSON: () => ({}),
    } as DOMRect);
    vi.spyOn(nearer, "getBoundingClientRect").mockReturnValue({
      top: 320, bottom: 700, left: 0, right: 100, width: 100, height: 380, x: 0, y: 320, toJSON: () => ({}),
    } as DOMRect);

    act(() => MockIntersectionObserver.instances[0]?.trigger([
      { target: earlier, isIntersecting: true },
      { target: nearer, isIntersecting: true },
    ]));

    expect(screen.getByText("nearer")).toBeDefined();
  });

  it("disconnects its observer on unmount", () => {
    installIntersectionObserver();
    const { unmount } = render(
      <>
        <section id="intro" />
        <ActiveSection ids={["intro"]} />
      </>,
    );
    const observer = MockIntersectionObserver.instances[0];

    unmount();

    expect(observer?.disconnect).toHaveBeenCalledTimes(1);
  });

  it("does not throw when IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    expect(() => render(<ActiveSection ids={["not-present"]} />)).not.toThrow();
    expect(screen.getByText("not-present")).toBeDefined();
  });
});
