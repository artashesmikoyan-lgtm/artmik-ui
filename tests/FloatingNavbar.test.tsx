import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FloatingNavbar, type FloatingNavbarItem } from "../src/components/FloatingNavbar";
import navbarSource from "../src/components/FloatingNavbar.tsx?raw";
import { installMatchMedia } from "./test-utils";

const items: readonly FloatingNavbarItem[] = [
  { href: "#overview", label: "Overview" },
  { href: "#details", label: "Details" },
];

describe("FloatingNavbar", () => {
  it("contains no hardcoded portfolio-specific labels or sections", () => {
    expect(navbarSource).not.toMatch(/Art Mik|Rivo|Dilemma Gedonista|href="#(?:hero|work|about|stack|tutorials|contact)"/i);
  });

  it("renders the supplied brand, generic links, and action slot", () => {
    installMatchMedia();
    render(
      <FloatingNavbar
        brand={<span>Example Studio</span>}
        items={items}
        action={<a href="/download">Download</a>}
      />,
    );

    expect(screen.getByText("Example Studio")).toBeDefined();
    expect(screen.getByRole("link", { name: "Overview" }).getAttribute("href")).toBe("#overview");
    expect(screen.getByRole("link", { name: "Details" }).getAttribute("href")).toBe("#details");
    expect(screen.getByRole("link", { name: "Download" }).getAttribute("href")).toBe("/download");
  });

  it("marks the active hash link with aria-current", () => {
    installMatchMedia();
    render(
      <>
        <section id="overview" />
        <FloatingNavbar items={items} />
      </>,
    );

    expect(screen.getByRole("link", { name: "Overview" }).getAttribute("aria-current")).toBe("location");
    expect(screen.getByRole("link", { name: "Details" }).hasAttribute("aria-current")).toBe(false);
  });

  it("collapses the links after the configured scroll threshold", () => {
    installMatchMedia();
    render(<FloatingNavbar items={items} collapseAfter={40} />);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 50 });

    fireEvent.scroll(window);

    expect(document.querySelector(".amui-navbar")?.getAttribute("data-collapsed")).toBe("true");
  });

  it("uses native links and an accessible menu button", async () => {
    installMatchMedia();
    const user = userEvent.setup();
    render(<FloatingNavbar items={items} />);

    const toggle = screen.getByRole("button", { name: "Open navigation" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("link", { name: "Overview" }).tagName).toBe("A");

    await user.click(toggle);

    expect(screen.getByRole("button", { name: "Close navigation" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("closes the mobile menu with Escape and returns focus to its toggle", async () => {
    installMatchMedia();
    const user = userEvent.setup();
    render(<FloatingNavbar items={items} />);

    const toggle = screen.getByRole("button", { name: "Open navigation" });
    await user.click(toggle);
    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Open navigation" }).getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("closes the mobile menu after navigation and restores focus to the toggle", async () => {
    installMatchMedia();
    const user = userEvent.setup();
    render(<FloatingNavbar items={items} />);

    const toggle = screen.getByRole("button", { name: "Open navigation" });
    await user.click(toggle);
    await user.click(screen.getByRole("link", { name: "Overview" }));

    expect(screen.getByRole("button", { name: "Open navigation" }).getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("exposes the reduced-motion preference without custom smooth-scroll handling", () => {
    installMatchMedia(true);
    render(<FloatingNavbar items={items} />);

    expect(document.querySelector(".amui-navbar")?.getAttribute("data-reduced-motion")).toBe("true");
    expect(document.querySelector(".amui-navbar a")?.getAttribute("href")).toBe("#overview");
  });
});
