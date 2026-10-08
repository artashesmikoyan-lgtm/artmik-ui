import { validateRegistry } from "./registry.mjs";

const errors = await validateRegistry();
if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Registry validation passed.");
}
