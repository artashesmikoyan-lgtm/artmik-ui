import assert from "node:assert/strict";
import { access, cp, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import {
  isSafeRelativePath,
  readRegistry,
  repositoryRoot,
  resolveRegistryFile,
} from "./registry.mjs";

async function listFiles(directory, base = directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) results.push(...await listFiles(path, base));
    else results.push(relative(base, path).split(sep).join("/"));
  }
  return results;
}

const { registry } = await readRegistry();
const destination = await mkdtemp(join(tmpdir(), "artmik-ui-registry-install-"));

try {
  for (const item of registry.items) {
    const itemDestination = resolve(destination, item.name);
    const files = [
      ...item.files.map((file) => ({
        source: file.path,
        target: file.target ?? file.path.split("/").at(-1),
      })),
      ...item.meta.assets.map((asset) => ({
        source: asset,
        target: `assets/${asset.split("/").at(-1)}`,
      })),
    ];

    for (const file of files) {
      assert.ok(isSafeRelativePath(file.target), `${item.name} installation target is safe`);
      const source = await resolveRegistryFile(repositoryRoot, file.source);
      const target = resolve(itemDestination, file.target);
      const fromDestination = relative(itemDestination, target);
      assert.ok(
        fromDestination !== ".." && !fromDestination.startsWith(`..${sep}`),
        `${item.name} target stays within the staged installation`,
      );
      await mkdir(dirname(target), { recursive: true });
      await cp(source, target);
    }

    for (const file of files) {
      const target = resolve(itemDestination, file.target);
      await access(target);
      assert.deepEqual(
        await readFile(target),
        await readFile(await resolveRegistryFile(repositoryRoot, file.source)),
        `${item.name}/${file.target} matches its declared source`,
      );
    }

    const component = item.files.find(({ type }) => type === "registry:component");
    const componentPath = resolve(itemDestination, component.target ?? component.path.split("/").at(-1));
    const componentSource = await readFile(componentPath, "utf8");
    assert.match(componentSource, /from\s+["']react["']/);
    assert.doesNotMatch(componentSource, /from\s+["'][^"']*(?:demo|gallery|src\/)[^"']*["']/);

    const installedNames = (await listFiles(itemDestination)).sort();
    assert.deepEqual(installedNames, files.map(({ target }) => target).sort());
    assert.equal(installedNames.length, files.length, `${item.name} staging has only declared files`);
  }

  console.log(`Registry installation smoke test passed (${registry.items.length} items and declared files/assets staged).`);
} finally {
  await rm(destination, { force: true, recursive: true });
}
