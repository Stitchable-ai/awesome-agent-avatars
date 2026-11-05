// Reports what each public entry costs an app: minified + gzip, including the shared
// chunks it imports, and (separately) the optional peer libraries it needs.
import { build } from "esbuild";
import { gzipSync } from "node:zlib";

const root = new URL("..", import.meta.url).pathname;
const cases = [
  ["awesome-agent-avatars (core engine, motion, props, CSS)", `import { createAvatar } from "awesome-agent-avatars"; console.log(createAvatar);`, []],
  ["awesome-agent-avatars/react", `import { AgentAvatar } from "awesome-agent-avatars/react"; console.log(AgentAvatar);`, ["react", "react-dom"]],
  ["awesome-agent-avatars/styles/micah", `import { micah } from "awesome-agent-avatars/styles/micah"; console.log(micah);`, ["@dicebear/core"]],
  ["awesome-agent-avatars/styles/avataaars", `import { avataaars } from "awesome-agent-avatars/styles/avataaars"; console.log(avataaars);`, ["@dicebear/core"]],
  ["awesome-agent-avatars/styles/gaze", `import { gaze } from "awesome-agent-avatars/styles/gaze"; console.log(gaze);`, ["@dicebear/core"]],
  ["awesome-agent-avatars/styles/fluent", `import { fluent } from "awesome-agent-avatars/styles/fluent"; console.log(fluent);`, []],
  ["awesome-agent-avatars/styles/nice", `import { nice } from "awesome-agent-avatars/styles/nice"; console.log(nice);`, ["react", "react-dom"]],
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
