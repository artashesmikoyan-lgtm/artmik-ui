import { access, cp, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { repositoryRoot, readRegistry } from "./registry.mjs";

const { registry } = await readRegistry();
const item = registry.items.find(({ name }) => name === "editorial-card");
if (!item) throw new Error("The editorial-card registry item is missing.");

const destination = await mkdtemp(join(tmpdir(), "artmik-ui-registry-install-"));

try {
  for (const file of item.files) {
    const source = resolve(repositoryRoot, file.path);
    const target = resolve(destination, file.target ?? file.path.split("/").at(-1));
    const fromDestination = relative(destination, target);
    if (fromDestination === ".." || fromDestination.startsWith(`..${sep}`)) {
      throw new Error(`The installer target escapes its staging directory: ${file.target}.`);
    }
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true });
  }

  for (const file of item.files) {
    const target = resolve(destination, file.target ?? file.path.split("/").at(-1));
    await access(target);
  }

  const componentPath = resolve(
    destination,
    item.files.find(({ type }) => type === "registry:component").target,
  );
  const componentSource = await readFile(componentPath, "utf8");
  if (!/from\s+["']react["']/.test(componentSource)) {
    throw new Error("The installed component must import React directly.");
  }
  if (/from\s+["'][^"']*(?:demo|gallery|src\/)[^"']*["']/.test(componentSource)) {
    throw new Error("The installed component must not depend on private gallery files.");
  }

  console.log(`Registry installation smoke test passed (${item.files.length} files staged).`);
} finally {
  await rm(destination, { force: true, recursive: true });
}
