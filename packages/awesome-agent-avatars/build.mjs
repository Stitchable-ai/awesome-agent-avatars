// Builds ESM entry points (shared code split into chunks so the engine loads once),
// a standalone stylesheet, and type declarations.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const here = new URL(".", import.meta.url).pathname;
rmSync(here + "dist", { recursive: true, force: true });
const entries = ["index", "author", "react", "dicebear", "styles/micah", "styles/avataaars", "styles/gaze", "styles/nice", "styles/fluent"];
await build({
  absWorkingDir: here,
  entryPoints: Object.fromEntries(entries.map((e) => [e, `src/${e}.${e === "react" ? "tsx" : "ts"}`])),
  outdir: "dist",
  bundle: true,
  splitting: true,
  format: "esm",
  target: "es2020",
  // the style entries import their DiceBear JSON `with { type: "json" }`, which Node and the spec
  // require for an external JSON module; keep the attribute instead of refusing it for the target
  supported: { "import-attributes": true },
  minify: true,
  sourcemap: true,
  chunkNames: "chunks/[name]-[hash]",
  external: ["react", "react-dom", "react-dom/*", "react/*", "react-nice-avatar", "@dicebear/core", "@dicebear/styles", "@dicebear/styles/*"],
  logLevel: "warning",
});
// Next.js App Router needs the directive at the top of the emitted React entry.
const { readFileSync } = await import("node:fs");
const r = here + "dist/react.js";
writeFileSync(r, '"use client";\n' + readFileSync(r, "utf8").replace(/^"use client";\s*/, ""));
// stylesheet as a file, for apps that import CSS themselves (strict CSP: injectStyles: false)
const { stylesheet } = await import(here + "src/css.ts").catch(async () => ({ stylesheet: (await import(here + "dist/index.js")).stylesheet }));
mkdirSync(here + "dist", { recursive: true });
writeFileSync(here + "dist/styles.css", stylesheet + "\n");
// the recipe file's schema, for editors and hosts that validate avatar.json themselves
const { RECIPE_SCHEMA } = await import(here + "dist/author.js");
mkdirSync(here + "schema", { recursive: true });
writeFileSync(here + "schema/avatar.schema.json", JSON.stringify(RECIPE_SCHEMA, null, 2) + "\n");
execFileSync(process.execPath, [here + "../../node_modules/typescript/bin/tsc", "-p", here + "tsconfig.json"], { stdio: "inherit" });
console.log("built", entries.length, "entries");
