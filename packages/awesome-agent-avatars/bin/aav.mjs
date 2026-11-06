#!/usr/bin/env node
// aav: the authoring layer from a shell, for agents with run_command and for people.
// The recipe is a file (avatar.json); every command reports what it did and what it could not.
//
//   aav styles                                   the styles available (built in, plus --styles <dir>)
//   aav describe <style|avatar.json>             fields, options with tags, what is free, what is impossible
//   aav new <avatar.json> --style gaze [--name]  a recipe with the style's defaults
//   aav edit <avatar.json> --trait hairColor=blue --trait hat=cap --set glassesVariant=none --wear cap
//   aav switch <avatar.json> avataaars           move to another style, carrying what carries
//   aav check <avatar.json>                      validate a recipe against its style
//   aav render <avatar.json> [--face happy] [-o still.svg|.png]
//   aav lint <style.json|style.mjs|dir>          problems a new style has, before it is registered
//   aav style new <dir> --derive gaze | --compose micah [--module]   scaffold a new style package
//
// Flags: --json (machine output), --styles <dir> (style packages: <id>/style.json or <id>/style.mjs),
//        --palette name=#hex (host colour names), --dry (edit without writing).
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// fileURLToPath, not URL.pathname: the pathname keeps %20 for a space and a leading /C: on Windows,
// so an install under "My Projects" or C:\Users\… could not find its own dist
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = (f) => pathToFileURL(path.join(here, "../dist", f)).href;
const A = await import(dist("author.js"));
const core = await import(dist("index.js"));

const argv = process.argv.slice(2);
const flags = {}, pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--") && a !== "-o") { pos.push(a); continue; }
  const k = a === "-o" ? "out" : a.slice(2);
  const v = argv[i + 1] !== undefined && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
  (flags[k] ??= []).push(v);
}
const one = (k) => flags[k]?.[0];
const json = !!flags.json;
const out = (human, data) => { if (json) console.log(JSON.stringify(data, null, 2)); else console.log(human); };
const fail = (msg, code = 1) => { if (json) console.log(JSON.stringify({ error: msg })); else console.error("aav: " + msg); process.exit(code); };
const kv = (list = []) => Object.fromEntries(list.map((s) => { const i = s.indexOf("="); return i < 0 ? [s, "true"] : [s.slice(0, i), s.slice(i + 1)]; }));

// ---- styles: built in, plus packages in --styles dirs (data specs or modules) ----
const BUILTIN = ["micah", "avataaars", "gaze", "nice", "fluent"];
const styles = new Map();
const resolve = (id) => styles.get(id);
for (const id of BUILTIN) {
  try { const m = await import(dist(`styles/${id}.js`)); styles.set(id, m[id] || m.default); }
  catch (e) { styles.set(id, { id, name: id, unavailable: `needs a browser (${(e.message || "").split("\n")[0]})` }); }
}
for (const dir of flags.styles || []) {
  for (const name of existsSync(dir) ? readdirSync(dir) : []) {
    const base = path.join(dir, name);
    try {
      if (existsSync(path.join(base, "style.json"))) { const spec = JSON.parse(readFileSync(path.join(base, "style.json"), "utf8")); styles.set(spec.id, A.styleFromSpec(spec, resolve)); }
      else if (existsSync(path.join(base, "style.mjs"))) { const m = await import(pathToFileURL(path.join(base, "style.mjs")).href); const s = m.default || Object.values(m)[0]; styles.set(s.id, s); }
    } catch (e) { console.error(`aav: style package ${base}: ${e.message}`); }
  }
}
const palette = kv(flags.palette);
const styleOf = (id) => { const s = resolve(id); if (!s) fail(`unknown style "${id}" (have: ${[...styles.keys()].join(", ")})`); if (s.unavailable) fail(`style "${id}" ${s.unavailable}`); return s; };
const readRecipe = (file) => { if (!existsSync(file)) fail(`no such file: ${file}`); const r = JSON.parse(readFileSync(file, "utf8")); return { r, style: styleOf(r.style) }; };
const writeRecipe = (file, r) => writeFileSync(file, JSON.stringify(r, null, 2) + "\n");

const [cmd, ...rest] = pos;
switch (cmd) {
  case "styles": {
    const list = [...styles.values()].map((s) => ({ id: s.id, name: s.name, tier: s.tier, credit: s.credit && `${s.credit.author} · ${s.credit.license}`, traits: s.traits ? Object.keys(s.traits) : [], unavailable: s.unavailable }));
    out(list.map((s) => `${s.id.padEnd(12)} ${s.name.padEnd(18)} ${s.unavailable ? "(" + s.unavailable + ")" : (s.credit || "") + "  traits: " + s.traits.join(", ")}`).join("\n"), list);
    break;
  }
  case "describe": {
    const target = rest[0] || fail("describe <style|avatar.json>");
    const { style, options } = target.endsWith(".json") ? (({ r, style }) => ({ style, options: r.options }))(readRecipe(target)) : { style: styleOf(target) };
    const d = A.describeStyle(style, options);
    const human = [
      `${d.style.name} (${d.style.id}) · ${d.style.tier} · ${d.style.credit}`,
      ...d.fields.map((f) => `  ${f.key.padEnd(20)} ${f.type}${f.free ? " (any value)" : ""}${f.optional ? " optional" : ""}: ` + (f.options ? f.options.map((o) => `${o.value}[${o.tags.join(" ")}]`).join(", ") : (f.swatches || []).join(" "))),
      `  traits: ${Object.entries(d.traits).filter(([, k]) => k).map(([t, k]) => `${t}→${k}`).join(", ")}`,
      `  can wear: ${d.wear.join(", ")}`,
      `  cannot: ${d.cannot.join("; ")}`,
      options ? `  current: ${JSON.stringify(options)}` : "",
    ].filter(Boolean).join("\n");
    out(human, d);
    break;
  }
  case "new": {
    const file = rest[0] || fail("new <avatar.json> --style <id>");
    const style = styleOf(one("style") || "gaze");
    const r = { v: 1, style: style.id, options: style.defaults(one("seed")), name: one("name") || "Stitch", wear: [] };
    writeRecipe(file, r); out(`wrote ${file}: ${style.name} defaults`, r);
    break;
  }
  case "edit": {
    const file = rest[0] || fail("edit <avatar.json> [--trait k=v] [--set k=v] [--wear x] [--unwear x]");
    const { r, style } = readRecipe(file);
    const res = A.applyEdit(style, r.options, { traits: kv(flags.trait), fields: kv(flags.set), wear: flags.wear, unwear: flags.unwear }, { palette, styles: [...styles.values()].filter((s) => !s.unavailable), wear: r.wear || [] });
    const next = { ...r, options: res.options, wear: res.wear };
    if (!flags.dry) writeRecipe(file, next);
    const human = [
      ...res.applied.map((c) => `✓ ${c.label}`),
      ...res.rejected.map((x) => `✗ ${x.trait || x.key}: ${x.reason}${x.alternatives.length ? `\n    try: ${x.alternatives.join(" · ")}` : ""}`),
      ...res.switchable.map((s) => `→ switch to ${s.name} (${s.style}) for ${s.has.join(", ")}: aav switch ${file} ${s.style}`),
      flags.dry ? "(dry run: nothing written)" : `wrote ${file}`,
    ].join("\n");
    out(human, { ...res, recipe: next, written: !flags.dry });
    if (res.rejected.length && !res.applied.length) process.exitCode = 2;
    break;
  }
  case "switch": {
    const [file, to] = rest; if (!file || !to) fail("switch <avatar.json> <style>");
    const { r, style } = readRecipe(file); const target = styleOf(to);
    const res = A.carryTraits(style, r.options, target, { palette });
    const next = { ...r, style: target.id, options: res.options };
    if (!flags.dry) writeRecipe(file, next);
    out(`now ${target.name}. carried: ${res.carried.join(", ") || "nothing"}; lost: ${res.lost.join(", ") || "nothing"}${flags.dry ? " (dry run)" : ""}`, { ...res, recipe: next });
    break;
  }
  case "check": {
    const file = rest[0] || fail("check <avatar.json>");
    const { r, style } = readRecipe(file);
    const c = A.checkRecipe(r, style);
    out(c.ok ? `ok: ${file} is a valid ${style.name} recipe` : c.problems.map((p) => "✗ " + p).join("\n"), c);
    if (!c.ok) process.exitCode = 2;
    break;
  }
  case "render": {
    const file = rest[0] || fail("render <avatar.json> [--face f] [-o out.svg|.png|.html]");
    const { r, style } = readRecipe(file);
    const html = await A.renderStill(style, r.options, one("face") || "neutral");
    const o = one("out");
    if (!o) { console.log(html); break; }
    if (o.endsWith(".png")) {
      let Resvg; try { ({ Resvg } = await import("@resvg/resvg-js")); } catch { fail("PNG needs the optional @resvg/resvg-js (npm i -D @resvg/resvg-js); write .svg instead, or let the host rasterise"); }
      const svg = html.match(/<svg[\s\S]*<\/svg>/)?.[0] || fail("this style renders a picture, not SVG; save it as .html");
      writeFileSync(o, new Resvg(svg, { fitTo: { mode: "width", value: Number(one("size") || 512) } }).render().asPng());
    } else writeFileSync(o, html);
    out(`wrote ${o}`, { out: o });
    break;
  }
  case "lint": {
    const target = rest[0] || fail("lint <style.json|style.mjs|dir>");
    const file = statSync(target).isDirectory() ? ["style.json", "style.mjs"].map((f) => path.join(target, f)).find(existsSync) : target;
    if (!file) fail(`${target} has no style.json or style.mjs`);
    let style;
    if (file.endsWith(".json")) style = A.styleFromSpec(JSON.parse(readFileSync(file, "utf8")), resolve);
    else { const m = await import(pathToFileURL(path.resolve(file)).href); style = m.default || Object.values(m)[0]; }
    const issues = await A.lintStyle(style);
    const errors = issues.filter((i) => i.level === "error"), warns = issues.filter((i) => i.level !== "error");
    const head = errors.length ? `✗ ${style.name}: ${errors.length} error(s), not registrable` : `ok: ${style.name} passes${warns.length ? ` (${warns.length} warning${warns.length > 1 ? "s" : ""})` : ""}`;
    out([head, ...issues.map((i) => `  ${i.level === "error" ? "✗" : "!"} ${i.code}: ${i.message}`)].join("\n"), { style: style.id, ok: !errors.length, issues });
    if (issues.some((i) => i.level === "error")) process.exitCode = 2;
    break;
  }
  case "style": {
    if (rest[0] !== "new") fail("style new <dir> --derive <from> | --compose <base> [--module]");
    const dir = rest[1] || fail("style new <dir>"); mkdirSync(dir, { recursive: true });
    const id = path.basename(dir).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (flags.module) {
      writeFileSync(path.join(dir, "style.mjs"), `// A style from scratch: SVG strings whose parts carry class="aav-part-<name>" (eyes, mouth, head…).
// Check it with: aav lint ${dir}    Preview it with: aav new /tmp/a.json --style ${id} --styles ${path.dirname(dir)} && aav render /tmp/a.json
export default {
  id: "${id}", name: "${id}", tier: "parts",
  credit: { author: "me", license: "MIT" },
  provenance: { kind: "module", from: [], by: "agent", at: "${new Date().toISOString().slice(0, 10)}" },
  traits: { bodyColor: "color" },
  fields: [{ key: "color", label: "Colour", type: "color", swatches: ["#9cc8fb", "#fbabaf", "#9bd78d"] }],
  defaults: () => ({ color: "#9cc8fb" }),
  render: ({ color }) => {
    const face = (eyes, mouth) => \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g class="aav-part-head"><rect x="15" y="25" width="70" height="55" rx="27" fill="\${color}"/></g><g class="aav-part-eyes">\${eyes}</g><g class="aav-part-mouth">\${mouth}</g></svg>\`;
    const dots = '<circle cx="38" cy="50" r="5" fill="#0f172a"/><circle cx="62" cy="50" r="5" fill="#0f172a"/>';
    const happy = '<path d="M32 52q6-8 12 0M56 52q6-8 12 0" stroke="#0f172a" stroke-width="3" fill="none"/>';
    return { id: "${id}", tier: "parts", parallax: { eyes: 4, mouth: 2 },
      faces: { neutral: face(dots, '<path d="M42 66q8 5 16 0" stroke="#0f172a" stroke-width="3" fill="none"/>'), happy: face(happy, '<path d="M40 64q10 10 20 0" stroke="#0f172a" stroke-width="3" fill="none"/>'),
        talk: face(dots, '<ellipse cx="50" cy="67" rx="6" ry="4" fill="#0f172a"/>'), sleepy: face('<path d="M32 50h12M56 50h12" stroke="#0f172a" stroke-width="3"/>', '<path d="M44 66h12" stroke="#0f172a" stroke-width="3"/>'), surprised: face('<circle cx="38" cy="50" r="7" fill="#0f172a"/><circle cx="62" cy="50" r="7" fill="#0f172a"/>', '<ellipse cx="50" cy="68" rx="5" ry="6" fill="#0f172a"/>') } };
  },
};
`);
    } else if (one("compose")) {
      writeFileSync(path.join(dir, "style.json"), JSON.stringify({ kind: "compose", id, name: id, base: one("compose"), by: "agent",
        layers: [{ from: "avataaars", part: "top", field: "topVariant", key: "hat", label: "Hat", group: "Hair", only: ["hat", "winterHat1", "winterHat02", "hijab", "turban"], fit: "crown", hides: ["hair"], trait: "hat" }] }, null, 2) + "\n");
    } else {
      writeFileSync(path.join(dir, "style.json"), JSON.stringify({ kind: "derive", id, name: id, from: one("derive") || "gaze", by: "agent", drop: ["bodyColor"], set: { bodyColor: "#7c3aee" },
        gradient: { replace: "#7c3aee", stops: ["#7C3AED", "#EC4899"], angle: 135 } }, null, 2) + "\n");
    }
    out(`scaffolded ${dir}; next: aav lint ${dir}`, { dir, id });
    break;
  }
  default:
    fail("usage: aav styles | describe | new | edit | switch | check | render | lint | style new   (see the header of bin/aav.mjs)", cmd ? 1 : 0);
}
