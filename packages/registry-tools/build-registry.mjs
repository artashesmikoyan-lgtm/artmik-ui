import { buildRegistryArtifacts } from "./artifacts.mjs";

const outputDirectory = await buildRegistryArtifacts();
console.log(`Registry artifacts generated at ${outputDirectory}.`);
