// Reports what each public entry costs an app: minified + gzip, including the shared
// chunks it imports, and (separately) the optional peer libraries it needs.
import { build } from "esbuild";
import { gzipSync } from "node:zlib";

const root = new URL("..", import.meta.url).pathname;
const cases = [
  ["bot-styles (core engine, motion, props, CSS)", `import { createAvatar } from "bot-styles"; console.log(createAvatar);`, []],
  ["bot-styles/react", `import { AgentAvatar } from "bot-styles/react"; console.log(AgentAvatar);`, ["react", "react-dom"]],
  ["bot-styles/styles/micah", `import { micah } from "bot-styles/styles/micah"; console.log(micah);`, ["@dicebear/core"]],
  ["bot-styles/styles/avataaars", `import { avataaars } from "bot-styles/styles/avataaars"; console.log(avataaars);`, ["@dicebear/core"]],
  ["bot-styles/styles/gaze", `import { gaze } from "bot-styles/styles/gaze"; console.log(gaze);`, ["@dicebear/core"]],
  ["bot-styles/styles/fluent", `import { fluent } from "bot-styles/styles/fluent"; console.log(fluent);`, []],
  ["bot-styles/styles/nice", `import { nice } from "bot-styles/styles/nice"; console.log(nice);`, ["react", "react-dom"]],
];
async function size(code, external) {
  const r = await build({ stdin: { contents: code, resolveDir: root, loader: "js" }, bundle: true, minify: true, format: "esm", write: false, external, logLevel: "silent", platform: "browser" });
  const b = r.outputFiles[0].contents; return [b.length, gzipSync(b).length];
}
const kb = (n) => (n / 1024).toFixed(1) + " KB";
const rows = [];
for (const [name, code, ext] of cases) {
  const [min, gz] = await size(code, ext);
  rows.push(`| \`${name.split(" ")[0]}\`${name.includes(" (") ? " " + name.slice(name.indexOf(" (")) : ""} | ${kb(min)} | **${kb(gz)}** | ${ext.length ? ext.join(", ") + " (yours)" : "none"} |`);
}
const [, dgz] = await size(`import { Avatar } from "@dicebear/core"; console.log(Avatar);`, []);
console.log("| Import | Minified | Gzipped | Peers excluded |\n|---|---|---|---|\n" + rows.join("\n"));
console.log(`\n@dicebear/core itself: ${kb(dgz)} gzipped (shared by all DiceBear styles).`);
