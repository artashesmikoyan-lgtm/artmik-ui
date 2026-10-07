import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Reveal } from "../src/components/Reveal";
import { StaggerReveal } from "../src/components/StaggerReveal";
import {
  installIntersectionObserver,
  installMatchMedia,
  MockIntersectionObserver,
} from "./test-utils";

describe("Reveal", () => {
  it("renders children and reveals them when observed intersecting", () => {
    installMatchMedia();
    installIntersectionObserver();
    const { container } = render(<Reveal>Readable content</Reveal>);
    const reveal = container.firstElementChild!;
    const observer = MockIntersectionObserver.instances[0];

    expect(screen.getByText("Readable content")).toBeDefined();
    expect(reveal.getAttribute("data-visible")).toBe("false");
    act(() => observer?.trigger([{ target: reveal, isIntersecting: true }]));
    expect(reveal.getAttribute("data-visible")).toBe("true");
  });

  it("disconnects its observer when unmounted", () => {
    installMatchMedia();
    installIntersectionObserver();
    const { unmount } = render(<Reveal>Readable content</Reveal>);
    const observer = MockIntersectionObserver.instances[0];

    unmount();

    expect(observer?.disconnect).toHaveBeenCalledTimes(1);
  });

  it("keeps content visible without hiding it for reduced-motion users", () => {
    installMatchMedia(true);
    installIntersectionObserver();
    const { container } = render(<Reveal>Always visible</Reveal>);

    expect(container.firstElementChild?.getAttribute("data-visible")).toBe("true");
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });
});

describe("StaggerReveal", () => {
  it("renders children and applies the configured stagger step", () => {
    installMatchMedia();
    installIntersectionObserver();
    const { container } = render(
      <StaggerReveal step={120}>
        <p>First item</p>
        <p>Second item</p>
      </StaggerReveal>,
    );
    const stagger = container.firstElementChild!;
    const items = stagger.querySelectorAll(".amui-stagger__item");

    expect(screen.getByText("First item")).toBeDefined();
    expect(screen.getByText("Second item")).toBeDefined();
    expect((stagger as HTMLElement).style.getPropertyValue("--amui-stagger-step")).toBe("120ms");
    expect((items[1] as HTMLElement).style.getPropertyValue("--amui-stagger-index")).toBe("1");
  });

  it("does not hide children when reduced motion is preferred", () => {
    installMatchMedia(true);
    installIntersectionObserver();
    const { container } = render(<StaggerReveal><p>Visible item</p></StaggerReveal>);

    expect(container.firstElementChild?.getAttribute("data-visible")).toBe("true");
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });

  it("disconnects its observer when unmounted", () => {
    installMatchMedia();
    installIntersectionObserver();
    const { unmount } = render(<StaggerReveal><p>Visible item</p></StaggerReveal>);
    const observer = MockIntersectionObserver.instances[0];

    unmount();

    expect(observer?.disconnect).toHaveBeenCalledTimes(1);
  });
});
