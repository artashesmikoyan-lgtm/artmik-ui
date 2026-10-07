import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import packageJson from "../package.json";
import { HeadTracker } from "../src/components/HeadTracker";
import { installMatchMedia } from "./test-utils";

describe("HeadTracker", () => {
  it("keeps demo assets outside the packaged library files", () => {
    expect(packageJson.files).toEqual(["dist"]);
  });

  it("renders the supplied image and accessible alternative text", () => {
    installMatchMedia();
    render(<HeadTracker src="/generic-image.svg" alt="An abstract illustration" />);

    expect(screen.getByRole("img", { name: "An abstract illustration" }).getAttribute("src")).toBe("/generic-image.svg");
  });

  it("applies scale and responds to pointer movement", () => {
    installMatchMedia();
    const { container } = render(
      <HeadTracker src="/generic-image.svg" alt="Abstract face" scale={1.2} trackingStrength={1} />,
    );
    const tracker = container.firstElementChild!;
    Object.defineProperty(tracker, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    });

    fireEvent.pointerMove(tracker, { clientX: 75, clientY: 50, pointerType: "mouse" });

    expect((tracker as HTMLElement).style.getPropertyValue("--amui-head-scale")).toBe("1.2");
    expect((tracker as HTMLElement).style.getPropertyValue("--amui-head-x")).toBe("9px");
  });

  it("does not track touch movement when touch behavior is ignored", () => {
    installMatchMedia();
    const { container } = render(<HeadTracker src="/generic-image.svg" alt="Abstract face" />);
    const tracker = container.firstElementChild!;
    Object.defineProperty(tracker, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    });

    fireEvent.pointerMove(tracker, { clientX: 100, clientY: 100, pointerType: "touch" });

    expect((tracker as HTMLElement).style.getPropertyValue("--amui-head-x")).toBe("0px");
    expect((tracker as HTMLElement).style.getPropertyValue("--amui-head-y")).toBe("0px");
  });

  it("supports following touch movement when configured", () => {
    installMatchMedia();
    const { container } = render(
      <HeadTracker src="/generic-image.svg" alt="Abstract face" touchBehavior="follow" />,
    );
    const tracker = container.firstElementChild!;
    Object.defineProperty(tracker, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    });

    fireEvent.pointerMove(tracker, { clientX: 100, clientY: 50, pointerType: "touch" });

    expect((tracker as HTMLElement).style.getPropertyValue("--amui-head-x")).toBe("12.6px");
  });

  it("minimizes tracking when reduced motion is preferred", () => {
    installMatchMedia(true);
    const { container } = render(<HeadTracker src="/generic-image.svg" alt="Abstract face" />);
    const tracker = container.firstElementChild!;
    Object.defineProperty(tracker, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    });

    fireEvent.pointerMove(tracker, { clientX: 100, clientY: 100, pointerType: "mouse" });

    expect(tracker.getAttribute("data-reduced-motion")).toBe("true");
    expect((tracker as HTMLElement).style.getPropertyValue("--amui-head-x")).toBe("0px");
    expect((tracker as HTMLElement).style.getPropertyValue("--amui-head-scale")).toBe("1");
  });

  it("unmounts cleanly without leaving global pointer listeners behind", () => {
    installMatchMedia();
    const addEventListener = vi.spyOn(window, "addEventListener");
    const { unmount } = render(<HeadTracker src="/generic-image.svg" alt="Abstract face" />);

    expect(() => unmount()).not.toThrow();
    expect(addEventListener.mock.calls.some(([type]) => type === "pointermove")).toBe(false);
  });
});
