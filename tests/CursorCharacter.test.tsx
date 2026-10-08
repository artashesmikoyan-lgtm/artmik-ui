import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CursorCharacter } from "../src/components/CursorCharacter";
import { installMatchMedia } from "./test-utils";

const frames = ["/frame-0.webp", "/frame-1.webp", "/frame-2.webp", "/frame-3.webp"];

function renderCharacter(touchBehavior: "ignore" | "follow" = "ignore") {
  const result = render(
    <CursorCharacter
      frames={frames}
      centerSrc="/center.webp"
      alt="A character looking at the pointer"
      deadzone={10}
      touchBehavior={touchBehavior}
    />,
  );
  const character = result.container.firstElementChild as HTMLElement;
  Object.defineProperty(character, "getBoundingClientRect", {
    value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  });
  return { ...result, character };
}

describe("CursorCharacter", () => {
  it("starts on the center image with accessible alternative text", () => {
    installMatchMedia();
    renderCharacter();

    expect(screen.getByRole("img", { name: "A character looking at the pointer" }).getAttribute("src")).toBe(
      "/center.webp",
    );
  });

  it("selects the directional frame for the pointer angle", () => {
    installMatchMedia();
    const { character } = renderCharacter();

    fireEvent.pointerMove(window, { clientX: 50, clientY: 90, pointerType: "mouse" });

    expect(character.dataset.trackingFrame).toBe("1");
    expect(screen.getByRole("img").getAttribute("src")).toBe("/frame-1.webp");
  });

  it("returns to the center frame inside the deadzone", () => {
    installMatchMedia();
    const { character } = renderCharacter();

    fireEvent.pointerMove(window, { clientX: 50, clientY: 90, pointerType: "mouse" });
    fireEvent.pointerMove(window, { clientX: 50, clientY: 40, pointerType: "mouse" });

    expect(character.dataset.trackingFrame).toBe("center");
    expect(screen.getByRole("img").getAttribute("src")).toBe("/center.webp");
  });

  it("ignores touch movement by default", () => {
    installMatchMedia();
    const { character } = renderCharacter();

    fireEvent.pointerMove(window, { clientX: 50, clientY: 90, pointerType: "touch" });

    expect(character.dataset.trackingFrame).toBe("center");
  });

  it("follows touch movement when enabled and resets on release", () => {
    installMatchMedia();
    const { character } = renderCharacter("follow");

    fireEvent.pointerMove(window, { clientX: 50, clientY: 90, pointerType: "touch" });
    expect(character.dataset.trackingFrame).toBe("1");

    fireEvent.pointerUp(window, { pointerType: "touch" });
    expect(character.dataset.trackingFrame).toBe("center");
  });

  it("keeps the center frame when reduced motion is enabled", () => {
    installMatchMedia(true);
    const { character } = renderCharacter();

    fireEvent.pointerMove(window, { clientX: 50, clientY: 90, pointerType: "mouse" });

    expect(character.dataset.reducedMotion).toBe("true");
    expect(screen.getByRole("img").getAttribute("src")).toBe("/center.webp");
  });

  it("rejects an empty directional frame set", () => {
    installMatchMedia();

    expect(() => render(<CursorCharacter frames={[]} centerSrc="/center.webp" alt="A character" />)).toThrow(
      "CursorCharacter requires at least one directional frame.",
    );
  });
});
