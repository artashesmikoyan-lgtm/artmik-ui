import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CinematicHero } from "../src/components/CinematicHero";
import { InteractiveCharacterHero } from "../src/components/InteractiveCharacterHero";
import { KineticTypographyHero } from "../src/components/KineticTypographyHero";
import { installMatchMedia } from "./test-utils";

const frames = Array.from({ length: 8 }, (_, index) => `/portrait-${index}.svg`);

describe("CinematicHero", () => {
  it("sequences configurable lines and applies a damped pointer parallax", () => {
    installMatchMedia();
    let frame: FrameRequestCallback | undefined;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { container } = render(<CinematicHero title={["Made", "of moments."]} />);
    const hero = container.querySelector(".amui-cinematic-hero")!;
    const content = container.querySelector(".amui-cinematic-hero__content") as HTMLDivElement;
    vi.spyOn(hero, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 400, bottom: 600, width: 400, height: 600, toJSON: () => ({}),
    });
    fireEvent.pointerMove(hero, { clientX: 350, clientY: 500, pointerType: "mouse" });
    expect(frame).toBeDefined();
    act(() => frame?.(16));
    expect(content.style.getPropertyValue("--amui-cinematic-pointer-x")).not.toBe("0px");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Madeof moments.");
  });

  it("disables pointer parallax under reduced motion", () => {
    installMatchMedia(true);
    const { container } = render(<CinematicHero />);
    const hero = container.querySelector(".amui-cinematic-hero")!;
    fireEvent.pointerMove(hero, { clientX: 360, clientY: 450, pointerType: "mouse" });
    expect(hero.getAttribute("data-reduced-motion")).toBe("true");
    const content = container.querySelector(".amui-cinematic-hero__content") as HTMLDivElement;
    expect(content.style.getPropertyValue("--amui-cinematic-pointer-x")).toBe("");
  });
});

describe("InteractiveCharacterHero", () => {
  it("uses supplied directional frames and configurable touch behavior", () => {
    installMatchMedia();
    const { container } = render(
      <InteractiveCharacterHero
        frames={frames}
        alt="Original observatory automaton"
        touchBehavior="follow"
        characterPosition={{ x: 64, y: 50 }}
      />,
    );
    const character = container.querySelector(".amui-cursor-character") as HTMLElement;
    vi.spyOn(character, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, toJSON: () => ({}),
    });
    fireEvent.pointerMove(window, { clientX: 55, clientY: 95, pointerType: "touch" });
    expect(character.dataset.trackingFrame).toBe("2");
    expect(container.querySelector(".amui-interactive-character-hero")?.getAttribute("style"))
      .toContain("--amui-character-x: 64%");
    expect(screen.getByRole("img", { name: "Original observatory automaton" }).getAttribute("src"))
      .toBe(frames[2]);
    fireEvent.pointerUp(window, { pointerType: "touch" });
    expect(character.dataset.trackingFrame).toBe("center");
    expect(screen.getByRole("img", { name: "Original observatory automaton" })).toBeDefined();
  });

  it("holds the center artwork for reduced-motion users", () => {
    installMatchMedia(true);
    const { container } = render(
      <InteractiveCharacterHero frames={frames} centerSrc="/center.svg" alt="Motionless portrait" />,
    );
    const character = container.querySelector(".amui-cursor-character") as HTMLElement;
    fireEvent.pointerMove(window, { clientX: 90, clientY: 90, pointerType: "mouse" });
    expect(character.dataset.trackingFrame).toBe("center");
    expect(screen.getByRole("img", { name: "Motionless portrait" }).getAttribute("src")).toBe("/center.svg");
  });
});

describe("KineticTypographyHero", () => {
  it("renders readable title text and configurable word choreography", () => {
    installMatchMedia();
    render(<KineticTypographyHero lines={["Type moves", "the room."]} wordDelay={120} />);
    expect(screen.getByRole("heading", { name: "Type moves the room." })).toBeDefined();
    const words = document.querySelectorAll(".amui-kinetic-typography-hero__word");
    expect(words.length).toBe(4);
    expect(words[2].getAttribute("style")).toContain("--amui-kinetic-index: 2");
  });

  it("does not install scroll animation listeners when reduced motion is preferred", () => {
    installMatchMedia(true);
    const addListener = vi.spyOn(window, "addEventListener");
    const { container } = render(<KineticTypographyHero scrollAware />);
    const scrollListeners = addListener.mock.calls.filter(([type]) => type === "scroll");
    expect(scrollListeners).toHaveLength(0);
    expect(container.querySelector(".amui-kinetic-typography-hero")?.getAttribute("data-reduced-motion"))
      .toBe("true");
  });
});
