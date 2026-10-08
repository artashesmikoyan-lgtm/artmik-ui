import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const requiredExports = [
  "FloatingNavbar",
  "HeadTracker",
  "CursorCharacter",
  "EditorialSection",
  "EditorialCard",
  "Reveal",
  "StaggerReveal",
  "useScrollSpy",
  "useReducedMotion",
];

const packageEntry = resolve(root, manifest.exports["."].import);
const stylesExport = manifest.exports["./styles.css"];
const stylesEntry = resolve(root, typeof stylesExport === "string" ? stylesExport : stylesExport.import);
await access(packageEntry);
await access(stylesEntry);
await access(resolve(root, manifest.types));

const library = await import(pathToFileURL(packageEntry).href);
const missingExports = requiredExports.filter((name) => !(name in library));
if (missingExports.length > 0) {
  throw new Error(`Built package is missing public exports: ${missingExports.join(", ")}.`);
}

const require = createRequire(import.meta.url);
const commonJsEntry = resolve(root, manifest.main);
await access(commonJsEntry);
const commonJsLibrary = require(commonJsEntry);
const missingCommonJsExports = requiredExports.filter((name) => !(name in commonJsLibrary));
if (missingCommonJsExports.length > 0) {
  throw new Error(`CommonJS package is missing public exports: ${missingCommonJsExports.join(", ")}.`);
}

console.log(`Package consumer smoke test passed (ESM and CommonJS, ${requiredExports.length} public exports).`);
