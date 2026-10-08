import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import registry from "../registry.json";
import { EditorialCard } from "../registry/sections/editorial-card/component";
import { validateRegistry } from "../packages/registry-tools/registry.mjs";

describe("registry EditorialCard", () => {
  it("renders as a labelled article with configurable content and attributes", () => {
    render(
      <EditorialCard
        index="A"
        eyebrow="Foundation"
        title="A clear title"
        className="custom-card"
        data-testid="card"
      >
        Content stays semantic.
      </EditorialCard>,
    );

    expect(screen.getByRole("article", { name: "A clear title" }).className).toContain("custom-card");
    expect(screen.getByText("Foundation")).toBeDefined();
    expect(screen.getByText("A")).toBeDefined();
    expect(screen.getByText("Content stays semantic.")).toBeDefined();
  });

  it("is listed as a standalone, dependency-light registry item", () => {
    const item = registry.items.find(({ name }) => name === "editorial-card");

    expect(item?.type).toBe("registry:ui");
    expect(item?.dependencies).toEqual(["react"]);
    expect(item?.registryDependencies).toEqual([]);
    expect(item?.files.map(({ type }) => type)).toEqual(["registry:component", "registry:style"]);
    expect(item?.meta.assets).toEqual([]);
    expect(item?.meta.license).toBe("MIT");
  });

  it("passes registry metadata and source-file validation", async () => {
    await expect(validateRegistry()).resolves.toEqual([]);
  });
});
