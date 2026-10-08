import { access, readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export async function readRegistry(root = repositoryRoot) {
  const registryPath = resolve(root, "registry.json");
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  return { registry, registryPath };
}

export async function validateRegistry(root = repositoryRoot) {
  const errors = [];
  let registry;

  try {
    ({ registry } = await readRegistry(root));
  } catch (error) {
    return [`Unable to read registry.json: ${error.message}`];
  }

  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    return ["registry.json must contain an object."];
  }
  if (registry.$schema !== "https://ui.shadcn.com/schema/registry.json") {
    errors.push("registry.json must reference the official shadcn registry schema.");
  }
  if (registry.name !== "artmik-ui") errors.push("registry.json must have the name artmik-ui.");
  if (typeof registry.homepage !== "string") errors.push("registry.json must declare its homepage.");
  if (!Array.isArray(registry.items)) errors.push("registry.json must contain an items array.");
  if (!Array.isArray(registry.items)) return errors;

  const seenNames = new Set();

  for (const item of registry.items) {
    if (!item || typeof item !== "object") {
      errors.push("Every registry item must be an object.");
      continue;
    }

    if (typeof item.name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.name)) {
      errors.push(`Invalid registry item name: ${String(item.name)}.`);
      continue;
    }
    if (seenNames.has(item.name)) errors.push(`Duplicate registry item: ${item.name}.`);
    seenNames.add(item.name);

    if (item.$schema !== "https://ui.shadcn.com/schema/registry-item.json") {
      errors.push(`${item.name} must reference the official shadcn registry item schema.`);
    }
    if (item.type !== "registry:ui") errors.push(`${item.name} must use type registry:ui.`);
    if (!item.title || !item.description) errors.push(`${item.name} needs a title and description.`);
    if (!Array.isArray(item.dependencies) || !Array.isArray(item.registryDependencies)) {
      errors.push(`${item.name} must declare dependencies and registryDependencies arrays.`);
    }
    const dependencies = new Set(Array.isArray(item.dependencies) ? item.dependencies : []);
    if (!Array.isArray(item.files) || item.files.length === 0) {
      errors.push(`${item.name} must declare at least one file.`);
      continue;
    }

    let hasComponent = false;
    let hasStyle = false;
    const destinations = new Set();

    for (const file of item.files) {
      if (!file || typeof file.path !== "string" || typeof file.type !== "string") {
        errors.push(`${item.name} has a file entry without path or type.`);
        continue;
      }

      if (file.path.includes("\\")) errors.push(`${item.name} source paths must use forward slashes.`);
      const sourcePath = resolve(root, file.path);
      const fromRoot = relative(root, sourcePath);
      if (isAbsolute(file.path) || fromRoot === ".." || fromRoot.startsWith(`..${sep}`)) {
        errors.push(`${item.name} has a source path outside the repository: ${file.path}.`);
        continue;
      }

      try {
        await access(sourcePath);
      } catch {
        errors.push(`${item.name} references a missing source file: ${file.path}.`);
      }

      const destination = file.target ?? file.path.split("/").at(-1);
      if (typeof destination !== "string" || destination.includes("\\") || isAbsolute(destination)) {
        errors.push(`${item.name} has an invalid installation target.`);
        continue;
      }
      const stagedPath = resolve(root, destination);
      const fromRootTarget = relative(root, stagedPath);
      if (fromRootTarget === ".." || fromRootTarget.startsWith(`..${sep}`)) {
        errors.push(`${item.name} has an installation target outside its destination: ${destination}.`);
        continue;
      }
      if (destinations.has(destination)) errors.push(`${item.name} repeats installation target ${destination}.`);
      destinations.add(destination);
      if (!["registry:component", "registry:style", "registry:lib", "registry:hook"].includes(file.type)) {
        errors.push(`${item.name} uses an unsupported install file type: ${file.type}.`);
      }
      hasComponent ||= file.type === "registry:component";
      hasStyle ||= file.type === "registry:style";

      if (file.type === "registry:component" && file.path.endsWith(".tsx")) {
        try {
          const source = await readFile(sourcePath, "utf8");
          const importedPackages = [...source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)]
            .map((match) => match[1])
            .filter((specifier) => !specifier.startsWith(".") && !specifier.startsWith("node:"))
            .map((specifier) => specifier.startsWith("@")
              ? specifier.split("/").slice(0, 2).join("/")
              : specifier.split("/")[0]);
          for (const dependency of new Set(importedPackages)) {
            if (!dependencies.has(dependency)) {
              errors.push(`${item.name} imports ${dependency}, which is missing from dependencies.`);
            }
          }
        } catch (error) {
          errors.push(`${item.name} component source could not be read: ${error.message}`);
        }
      }
    }

    if (!hasComponent) errors.push(`${item.name} must include a registry:component file.`);
    if (!hasStyle) errors.push(`${item.name} must include a registry:style file.`);
    if (!item.meta || typeof item.meta !== "object") {
      errors.push(`${item.name} must include component metadata.`);
    } else {
      if (!Array.isArray(item.meta.tags) || item.meta.tags.length === 0) {
        errors.push(`${item.name} metadata must include tags.`);
      }
      if (!Array.isArray(item.meta.frameworks) || item.meta.frameworks.length === 0) {
        errors.push(`${item.name} metadata must include framework compatibility.`);
      }
      if (!Array.isArray(item.meta.assets)) errors.push(`${item.name} metadata must declare required assets.`);
      if (!item.meta.installation) errors.push(`${item.name} metadata must include installation instructions.`);
      if (!item.meta.reducedMotion) errors.push(`${item.name} metadata must describe reduced-motion support.`);
      if (!item.meta.license) errors.push(`${item.name} metadata must include license information.`);
    }

    const category = item.meta?.category;
    if (typeof category !== "string" || !/^[a-z]+$/.test(category)) {
      errors.push(`${item.name} metadata must declare a valid category.`);
      continue;
    }

    const itemMetadataPath = resolve(root, "registry", category, item.name, "metadata.json");
    try {
      const metadata = JSON.parse(await readFile(itemMetadataPath, "utf8"));
      if (metadata.id !== item.name) errors.push(`${item.name} metadata.json has a mismatched id.`);
      if (metadata.category !== item.meta.category) errors.push(`${item.name} metadata.json has a mismatched category.`);
      if (metadata.title !== item.title) errors.push(`${item.name} metadata.json has a mismatched title.`);
      if (metadata.description !== item.description) {
        errors.push(`${item.name} metadata.json has a mismatched description.`);
      }
      if (JSON.stringify(metadata.tags) !== JSON.stringify(item.meta.tags)) {
        errors.push(`${item.name} metadata.json has mismatched tags.`);
      }
      if (JSON.stringify(metadata.dependencies) !== JSON.stringify(item.dependencies)) {
        errors.push(`${item.name} metadata.json has mismatched dependencies.`);
      }
      if (JSON.stringify(metadata.frameworks) !== JSON.stringify(item.meta.frameworks)) {
        errors.push(`${item.name} metadata.json has mismatched frameworks.`);
      }
      if (JSON.stringify(metadata.assets) !== JSON.stringify(item.meta.assets)) {
        errors.push(`${item.name} metadata.json has mismatched assets.`);
      }
      if (JSON.stringify(metadata.files) !== JSON.stringify(item.files.map(({ path }) => path.split("/").at(-1)))) {
        errors.push(`${item.name} metadata.json has mismatched files.`);
      }
      if (metadata.installation !== item.meta.installation) {
        errors.push(`${item.name} metadata.json has mismatched installation instructions.`);
      }
      if (metadata.reducedMotion !== item.meta.reducedMotion) {
        errors.push(`${item.name} metadata.json has mismatched reduced-motion details.`);
      }
      if (metadata.license !== item.meta.license) errors.push(`${item.name} metadata.json has a mismatched license.`);
    } catch (error) {
      errors.push(`${item.name} metadata.json could not be read: ${error.message}`);
    }
  }

  return errors;
}
