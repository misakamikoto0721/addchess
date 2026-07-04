import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  // Bundle workspace core so Railway runtime does not need packages/core/dist.
  noExternal: ["@addchess/core"],
});
