// Packs the library and installs the tarball into a fresh project, the way an app gets it,
// so the `files` list, `exports`, peer dependencies and emitted declarations are exercised
// from outside the workspace. Then every entry is imported in Node (the server-render path)
// and the type tests are compiled against the installed copy with the TypeScript 5 most
// apps use (the workspace itself builds with a newer one).
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const pkgDir = path.join(root, "packages/awesome-agent-avatars");
const dev = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).devDependencies;
const dir = mkdtempSync(path.join(tmpdir(), "aav-pack-"));
const capture = (cmd, args, cwd = dir) => execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const show = (cmd, args, cwd = dir) => execFileSync(cmd, args, { cwd, stdio: "inherit" });

try {
  const [packed] = JSON.parse(capture("npm", ["pack", "--json", "--pack-destination", dir], pkgDir));
  const files = packed.files.map((f) => f.path);
  const must = ["package.json", "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "dist/index.js", "dist/author.js", "bin/aav.mjs", "schema/avatar.schema.json", "dist/react.js", "dist/dicebear.js", "dist/styles.css", "dist/types/index.d.ts", "dist/types/react.d.ts", "dist/styles/micah.js", "dist/types/styles/fluent.d.ts"];
  for (const f of must) if (!files.includes(f)) throw new Error(`the tarball lacks ${f}`);
  for (const f of files) if (/^(src|node_modules|tests)\//.test(f)) throw new Error(`the tarball leaks ${f}`);
  console.log(`packed ${packed.filename}: ${files.length} files, ${(packed.size / 1024).toFixed(0)} KB`);

  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "aav-consumer", private: true, type: "module" }));
  const pin = (name) => `${name}@${dev[name]}`;
  show("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", path.join(dir, packed.filename),
    pin("react"), pin("react-dom"), pin("@dicebear/core"), pin("@dicebear/styles"), pin("react-nice-avatar"), pin("@types/react"), pin("@types/react-dom"), "typescript@5"]);

  // every entry imports without a DOM, and the state list matches the pack
  show(process.execPath, ["--input-type=module", "-e", `
    const entries = ["awesome-agent-avatars", "awesome-agent-avatars/author", "awesome-agent-avatars/react", "awesome-agent-avatars/dicebear", ...["micah", "avataaars", "gaze", "nice", "fluent"].map((s) => "awesome-agent-avatars/styles/" + s)];
    for (const e of entries) { const m = await import(e); if (!Object.keys(m).length) throw new Error(e + " exports nothing"); }
    const { defaultMotion, STATE_NAMES } = await import("awesome-agent-avatars");
    const have = Object.keys(defaultMotion.states).sort().join(), want = [...STATE_NAMES].sort().join();
    if (have !== want) throw new Error("STATE_NAMES disagrees with the pack");
    console.log("imported " + entries.length + " entries in Node without a DOM");
  `]);

  // the aav CLI, as an agent with a shell reaches it from an installed copy
  writeFileSync(path.join(dir, "avatar.json"), JSON.stringify({ v: 1, style: "micah", options: {}, wear: [] }));
  const edited = JSON.parse(capture("npx", ["--no-install", "aav", "edit", "avatar.json", "--trait", "hairColor=blue", "--wear", "cap", "--json"]));
  if (edited.recipe.options.hairColor !== "#3b82f6" || edited.recipe.wear[0] !== "cap") throw new Error("aav edit did not apply from the installed tarball");
  console.log("ran the installed aav CLI: " + edited.applied.map((c) => c.label).join(", "));

  // the type tests, against the installed copy
  cpSync(path.join(root, "tests/types"), path.join(dir, "types"), { recursive: true });
  for (const cfg of ["tsconfig.json", "tsconfig.bundler.json"]) show("npx", ["tsc", "-p", path.join("types", cfg)]);
  console.log(`PASS check-pack: ${capture("npx", ["tsc", "-v"]).trim()} compiled the type tests against the installed tarball (NodeNext and Bundler)`);
} catch (error) {
  console.error("FAIL check-pack: " + (error.message || error));
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
