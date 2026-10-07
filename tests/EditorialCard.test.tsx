import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialCard } from "../src/components/EditorialCard";
import { EditorialSection } from "../src/components/EditorialSection";

describe("editorial primitives", () => {
  it("uses a labelled section with a heading and content", () => {
    render(
      <EditorialSection title="Overview" eyebrow="Foundation">
        Introductory copy
      </EditorialSection>,
    );

    expect(screen.getByRole("region", { name: "Overview" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Overview", level: 2 })).toBeDefined();
    expect(screen.getByText("Introductory copy")).toBeDefined();
  });

  it("renders a semantic article with its supplied title and content", () => {
    render(<EditorialCard title="A reusable card">Card content</EditorialCard>);

    expect(screen.getByRole("article", { name: "A reusable card" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "A reusable card", level: 3 })).toBeDefined();
    expect(screen.getByText("Card content")).toBeDefined();
  });
});
