import { deflateRawSync } from "node:zlib";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import {
  isSafeRelativePath,
  readRegistry,
  repositoryRoot,
  resolveRegistryFile,
  validateRegistry,
} from "./registry.mjs";

const ARTIFACT_DIRECTORY = "dist/registry-artifacts";
const REGISTRY_SCHEMA = "https://ui.shadcn.com/schema/registry.json";
const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";

function compareStrings(first, second) {
  if (first < second) return -1;
  if (first > second) return 1;
  return 0;
}

function jsonBuffer(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function utf8Content(buffer) {
  try {
    const content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return content.includes("\0") ? null : content;
  } catch {
    return null;
  }
}

function createZip(entries) {
  if (entries.length > 0xffff) throw new Error("Registry ZIP exceeds the supported entry count.");

  const localRecords = [];
  const centralRecords = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.path, "utf8");
    if (name.length > 0xffff || entry.content.length > 0xffffffff) {
      throw new Error(`Registry ZIP entry exceeds supported size: ${entry.path}.`);
    }
    const compressed = deflateRawSync(entry.content, { level: 9 });
    if (compressed.length > 0xffffffff) {
      throw new Error(`Compressed registry ZIP entry exceeds supported size: ${entry.path}.`);
    }
    const checksum = crc32(entry.content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x0021, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(entry.content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);

    const localRecord = Buffer.concat([localHeader, name, compressed]);
    localRecords.push(localRecord);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(0x0314, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x0021, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(entry.content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralRecords.push(Buffer.concat([centralHeader, name]));
    offset += localRecord.length;
  }

  const centralDirectory = Buffer.concat(centralRecords);
  if (offset > 0xffffffff || centralDirectory.length > 0xffffffff) {
    throw new Error("Registry ZIP exceeds the supported archive size.");
  }
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);

  return Buffer.concat([...localRecords, centralDirectory, endRecord]);
}

function installationDocument(item, files) {
  const dependencies = item.dependencies.length > 0 ? item.dependencies.join(", ") : "none";
  const fileList = files.map(({ target }) => `- \`${target}\``).join("\n");
  return [
    `# ${item.title}`,
    "",
    item.description,
    "",
    "## Installation",
    "",
    item.meta.installation,
    "",
    `Runtime dependencies: ${dependencies}.`,
    "",
    "Included files:",
    fileList,
    "",
    `License: ${item.meta.license}.`,
    "",
  ].join("\n");
}

async function loadComponentFiles(root, item) {
  const files = [];

  for (const file of item.files) {
    const target = file.target ?? basename(file.path);
    if (!isSafeRelativePath(target)) throw new Error(`${item.name} has an unsafe installation target: ${target}.`);
    const sourcePath = await resolveRegistryFile(root, file.path);
    files.push({
      path: `components/${item.name}/${target}`,
      target,
      type: file.type,
      isAsset: false,
      content: await readFile(sourcePath),
    });
  }

  const assetTargets = new Set();
  for (const asset of item.meta.assets) {
    const target = `assets/${basename(asset)}`;
    if (!isSafeRelativePath(target) || assetTargets.has(target)) {
      throw new Error(`${item.name} has a duplicate or unsafe asset target: ${target}.`);
    }
    assetTargets.add(target);
    const sourcePath = await resolveRegistryFile(root, asset);
    files.push({
      path: `components/${item.name}/${target}`,
      target,
      type: "registry:file",
      isAsset: true,
      content: await readFile(sourcePath),
    });
  }

  files.sort((a, b) => compareStrings(a.target, b.target));
  const targets = new Set();
  for (const file of files) {
    if (targets.has(file.target)) throw new Error(`${item.name} has duplicate install target ${file.target}.`);
    targets.add(file.target);
  }
  if (targets.has("INSTALL.md")) throw new Error(`${item.name} uses the reserved installation guide target.`);
  return files;
}

export async function buildRegistryArtifacts({
  root = repositoryRoot,
  outputDirectory = resolve(root, ARTIFACT_DIRECTORY),
} = {}) {
  const errors = await validateRegistry(root);
  if (errors.length > 0) throw new Error(`Registry validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);

  const { registry } = await readRegistry(root);
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const outputRoot = resolve(outputDirectory);
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  await mkdir(resolve(outputRoot, "r"), { recursive: true });
  await mkdir(resolve(outputRoot, "downloads"), { recursive: true });

  const index = {
    $schema: REGISTRY_SCHEMA,
    name: registry.name,
    homepage: registry.homepage,
    items: [],
  };
  const catalog = {
    schemaVersion: 1,
    name: registry.name,
    version: packageJson.version,
    components: [],
  };

  for (const sourceItem of [...registry.items].sort((a, b) => compareStrings(a.name, b.name))) {
    const files = await loadComponentFiles(root, sourceItem);
    const metadata = {
      ...sourceItem.meta,
      assets: sourceItem.meta.assets.map((asset) => `assets/${basename(asset)}`),
    };
    const itemFiles = files.map(({ target, type, isAsset, content }) => {
      const text = utf8Content(content);
      if (text === null && !isAsset) {
        throw new Error(`${sourceItem.name}/${target} must be UTF-8 text to be represented in registry JSON.`);
      }
      return {
        path: target,
        type,
        ...(text === null ? {} : { content: text }),
      };
    });
    const item = {
      $schema: ITEM_SCHEMA,
      name: sourceItem.name,
      type: sourceItem.type,
      title: sourceItem.title,
      description: sourceItem.description,
      dependencies: [...sourceItem.dependencies],
      registryDependencies: [...sourceItem.registryDependencies],
      files: itemFiles,
      meta: { ...metadata },
    };

    index.items.push({
      ...item,
      files: files.map(({ path, target, type }) => ({
        path,
        type,
        target,
      })),
    });

    const installDocument = Buffer.from(installationDocument(sourceItem, files), "utf8");
    const componentDirectory = resolve(outputRoot, "components", sourceItem.name);
    for (const file of files) {
      const destination = resolve(componentDirectory, file.target);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, file.content);
    }
    await writeFile(resolve(componentDirectory, "INSTALL.md"), installDocument);
    await writeFile(resolve(outputRoot, "r", `${sourceItem.name}.json`), jsonBuffer(item));

    const zipEntries = [
      ...files.map((file) => ({ path: `${sourceItem.name}/${file.target}`, content: file.content })),
      { path: `${sourceItem.name}/INSTALL.md`, content: installDocument },
    ].sort((a, b) => compareStrings(a.path, b.path));
    await writeFile(
      resolve(outputRoot, "downloads", `${sourceItem.name}.zip`),
      createZip(zipEntries),
    );

    catalog.components.push({
      id: metadata.id,
      name: sourceItem.name,
      title: sourceItem.title,
      description: sourceItem.description,
      category: metadata.category,
      tags: [...metadata.tags],
      frameworks: [...metadata.frameworks],
      dependencies: [...sourceItem.dependencies],
      registryDependencies: [...sourceItem.registryDependencies],
      files: files.map(({ target, type }) => ({ path: target, type })),
      assets: [...metadata.assets],
      installation: metadata.installation,
      reducedMotion: metadata.reducedMotion,
      license: metadata.license,
      provenance: metadata.provenance,
    });
  }

  await writeFile(resolve(outputRoot, "registry.json"), jsonBuffer(index));
  await writeFile(resolve(outputRoot, "catalog.json"), jsonBuffer(catalog));
  return outputRoot;
}
