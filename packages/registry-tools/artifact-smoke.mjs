import assert from "node:assert/strict";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { inflateRawSync } from "node:zlib";
import { mkdtemp, rm } from "node:fs/promises";
import { buildRegistryArtifacts, crc32 } from "./artifacts.mjs";
import { readRegistry, repositoryRoot, resolveRegistryFile } from "./registry.mjs";

async function listFiles(directory, base = directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) results.push(...await listFiles(path, base));
    else results.push(relative(base, path).split(sep).join("/"));
  }
  return results.sort();
}

function parseZip(archive) {
  let endOffset = -1;
  const minimumOffset = Math.max(0, archive.length - 0xffff - 22);
  for (let offset = archive.length - 22; offset >= minimumOffset; offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  assert.notEqual(endOffset, -1, "ZIP end-of-central-directory record exists");

  const count = archive.readUInt16LE(endOffset + 10);
  let cursor = archive.readUInt32LE(endOffset + 16);
  const entries = new Map();
  for (let index = 0; index < count; index += 1) {
    assert.equal(archive.readUInt32LE(cursor), 0x02014b50, "ZIP central directory entry is valid");
    const method = archive.readUInt16LE(cursor + 10);
    const checksum = archive.readUInt32LE(cursor + 16);
    const compressedSize = archive.readUInt32LE(cursor + 20);
    const uncompressedSize = archive.readUInt32LE(cursor + 24);
    const nameLength = archive.readUInt16LE(cursor + 28);
    const extraLength = archive.readUInt16LE(cursor + 30);
    const commentLength = archive.readUInt16LE(cursor + 32);
    const localOffset = archive.readUInt32LE(cursor + 42);
    const name = archive.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    assert.equal(method, 8, `${name} uses supported deflate compression`);
    assert.ok(!name.startsWith("/") && !name.split("/").includes(".."), `${name} has a safe archive path`);

    assert.equal(archive.readUInt32LE(localOffset), 0x04034b50, `${name} local header is valid`);
    const localNameLength = archive.readUInt16LE(localOffset + 26);
    const localExtraLength = archive.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
    const content = inflateRawSync(compressed);
    assert.equal(content.length, uncompressedSize, `${name} extracted size matches`);
    assert.equal(crc32(content), checksum, `${name} checksum matches`);
    assert.ok(!entries.has(name), `${name} does not appear twice in ZIP`);
    entries.set(name, content);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function assertTreeEqual(firstDirectory, secondDirectory) {
  const firstFiles = await listFiles(firstDirectory);
  const secondFiles = await listFiles(secondDirectory);
  assert.deepEqual(secondFiles, firstFiles, "repeated generation emits the same paths");
  for (const path of firstFiles) {
    const first = await readFile(resolve(firstDirectory, path));
    const second = await readFile(resolve(secondDirectory, path));
    assert.deepEqual(second, first, `${path} is byte-for-byte deterministic`);
  }
}

async function verifyBinaryAssetSupport(temporaryRoot) {
  const root = resolve(temporaryRoot, "binary-fixture");
  const componentDirectory = resolve(root, "registry", "heroes", "binary-hero");
  const assetPath = resolve(componentDirectory, "assets", "sample.bin");
  const assetBytes = Buffer.from([0, 255, 12, 128, 65, 0]);
  const componentSource = [
    'import { type PropsWithChildren } from "react";',
    "export function BinaryHero({ children }: PropsWithChildren) { return <section>{children}</section>; }",
    "",
  ].join("\n");
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "binary-hero",
    type: "registry:ui",
    title: "Binary Hero",
    description: "Fixture with one required binary asset.",
    dependencies: ["react"],
    registryDependencies: [],
    files: [{
      path: "registry/heroes/binary-hero/component.tsx",
      type: "registry:component",
      target: "binary-hero.tsx",
    }],
    meta: {
      id: "binary-hero",
      category: "heroes",
      tags: ["fixture"],
      frameworks: ["react"],
      assets: ["registry/heroes/binary-hero/assets/sample.bin"],
      installation: "Copy the component and its assets.",
      reducedMotion: "Static fixture.",
      license: "MIT",
      provenance: "ORIGINAL",
    },
  };
  const metadata = {
    ...item.meta,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,
    files: ["component.tsx"],
  };

  await mkdir(dirname(assetPath), { recursive: true });
  await writeFile(resolve(root, "registry.json"), JSON.stringify({
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "artmik-ui",
    homepage: "https://github.com/artashesmikoyan-lgtm/artmik-ui",
    items: [item],
  }));
  await writeFile(resolve(root, "package.json"), JSON.stringify({ version: "1.2.3" }));
  await writeFile(resolve(componentDirectory, "component.tsx"), componentSource);
  await writeFile(resolve(componentDirectory, "metadata.json"), JSON.stringify(metadata));
  await writeFile(assetPath, assetBytes);

  const output = await buildRegistryArtifacts({ root, outputDirectory: resolve(temporaryRoot, "binary-output") });
  const itemJson = JSON.parse(await readFile(resolve(output, "r", "binary-hero.json"), "utf8"));
  const assetItem = itemJson.files.find(({ path }) => path === "assets/sample.bin");
  assert.equal(assetItem.content, undefined, "binary assets are not corrupted into JSON text");
  assert.deepEqual(
    await readFile(resolve(output, "components", "binary-hero", "assets", "sample.bin")),
    assetBytes,
  );

  const archive = await readFile(resolve(output, "downloads", "binary-hero.zip"));
  const extracted = parseZip(archive);
  assert.deepEqual(extracted.get("binary-hero/assets/sample.bin"), assetBytes);
  assert.equal(extracted.get("binary-hero/INSTALL.md").includes(Buffer.from("Copy the component")), true);
}

const temporaryRoot = await mkdtemp(join(tmpdir(), "artmik-ui-artifact-smoke-"));
const firstOutput = resolve(temporaryRoot, "first");
const secondOutput = resolve(temporaryRoot, "second");

try {
  await buildRegistryArtifacts({ outputDirectory: firstOutput });
  await buildRegistryArtifacts({ outputDirectory: secondOutput });
  await assertTreeEqual(firstOutput, secondOutput);

  const { registry: sourceRegistry } = await readRegistry(repositoryRoot);
  const index = JSON.parse(await readFile(resolve(firstOutput, "registry.json"), "utf8"));
  const catalog = JSON.parse(await readFile(resolve(firstOutput, "catalog.json"), "utf8"));
  assert.equal(index.$schema, "https://ui.shadcn.com/schema/registry.json");
  assert.equal(catalog.schemaVersion, 1);
  assert.deepEqual(
    index.items.map(({ name }) => name),
    [...sourceRegistry.items].map(({ name }) => name).sort(),
    "generated shadcn index contains every registered item",
  );
  assert.deepEqual(
    catalog.components.map(({ id }) => id),
    index.items.map(({ name }) => name),
    "catalog and registry have matching item identities",
  );
  assert.deepEqual(
    catalog.components.filter(({ preview }) => preview).map(({ name }) => name),
    ["cinematic-hero", "interactive-character-hero", "kinetic-typography-hero"],
    "catalog identifies every registered interactive hero demo",
  );

  for (const registeredItem of sourceRegistry.items) {
    const item = index.items.find(({ name }) => name === registeredItem.name);
    const catalogEntry = catalog.components.find(({ id }) => id === registeredItem.name);
    const jsonItem = JSON.parse(await readFile(resolve(firstOutput, "r", `${registeredItem.name}.json`), "utf8"));
    const installableFiles = [
      ...registeredItem.files.map(async (file) => ({
        target: file.target ?? basename(file.path),
        type: file.type,
        content: await readFile(await resolveRegistryFile(repositoryRoot, file.path)),
      })),
      ...registeredItem.meta.assets.map(async (asset) => ({
        target: `assets/${basename(asset)}`,
        type: "registry:file",
        content: await readFile(await resolveRegistryFile(repositoryRoot, asset)),
      })),
    ];
    const expectedFiles = (await Promise.all(installableFiles))
      .sort((a, b) => a.target < b.target ? -1 : a.target > b.target ? 1 : 0);
    const expectedBundleFiles = [...expectedFiles.map(({ target }) => target), "INSTALL.md"].sort();
    const componentDirectory = resolve(firstOutput, "components", registeredItem.name);
    const actualBundleFiles = await listFiles(componentDirectory);

    assert.deepEqual(actualBundleFiles, expectedBundleFiles, `${registeredItem.name} bundle contains only declared files and INSTALL.md`);
    assert.equal(jsonItem.$schema, "https://ui.shadcn.com/schema/registry-item.json");
    assert.equal(jsonItem.name, registeredItem.name);
    assert.equal(jsonItem.files.length, expectedFiles.length);
    assert.equal(item.files.length, expectedFiles.length);
    assert.deepEqual(
      item.files.map(({ path, target, type }) => ({ path, target, type })),
      expectedFiles.map(({ target, type }) => ({
        path: `components/${registeredItem.name}/${target}`,
        target,
        type,
      })),
    );
    assert.equal(catalogEntry.category, registeredItem.meta.category);
    assert.deepEqual(catalogEntry.dependencies, registeredItem.dependencies);

    for (let index = 0; index < expectedFiles.length; index += 1) {
      const expected = expectedFiles[index];
      const generated = jsonItem.files[index];
      assert.equal(generated.path, expected.target);
      assert.equal(generated.type, expected.type);
      let expectedText;
      try {
        expectedText = new TextDecoder("utf-8", { fatal: true }).decode(expected.content);
        if (expectedText.includes("\0")) expectedText = undefined;
      } catch {
        expectedText = undefined;
      }
      if (expectedText === undefined) {
        assert.equal(generated.content, undefined, `${expected.target} binary data is not corrupted into text`);
      } else {
        assert.equal(generated.content, expectedText);
      }
      assert.deepEqual(await readFile(resolve(componentDirectory, expected.target)), expected.content);
    }

    const archive = await readFile(resolve(firstOutput, "downloads", `${registeredItem.name}.zip`));
    const extracted = parseZip(archive);
    assert.deepEqual(
      [...extracted.keys()].sort(),
      expectedBundleFiles.map((path) => `${registeredItem.name}/${path}`).sort(),
      `${registeredItem.name} ZIP contains every required bundle file and no extras`,
    );
    for (const [path, content] of extracted) {
      const localPath = path.slice(registeredItem.name.length + 1);
      assert.deepEqual(content, await readFile(resolve(componentDirectory, localPath)));
    }
  }

  await verifyBinaryAssetSupport(temporaryRoot);
  console.log(`Registry artifact integrity passed (${sourceRegistry.items.length} items; deterministic output and ZIP extraction verified).`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
