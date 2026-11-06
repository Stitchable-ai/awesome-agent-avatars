// The authoring layer, with no browser: run after `npm run build`.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { applyEdit, carryTraits, describeStyle, deriveStyle, fillGradient, composeStyle, lintStyle, sanitizeArt, renderStill, resolveColor, checkRecipe, styleFromSpec, TRAITS, WEARABLES } from "../packages/awesome-agent-avatars/dist/author.js";
import { PROPS } from "../packages/awesome-agent-avatars/dist/index.js";
import { micah } from "../packages/awesome-agent-avatars/dist/styles/micah.js";
import { avataaars } from "../packages/awesome-agent-avatars/dist/styles/avataaars.js";
import { gaze } from "../packages/awesome-agent-avatars/dist/styles/gaze.js";

const STYLES = [micah, avataaars, gaze];
const ASK = { traits: { hairColor: "blue", hat: "a hat", glasses: "none", topColor: "red" } };

test("every trait a built-in style declares is a real field, and every wearable is a prop", () => {
  for (const s of STYLES) for (const [t, key] of Object.entries(s.traits || {})) {
    assert.ok(TRAITS[t], `${s.id}: unknown trait ${t}`);
    assert.ok(s.fields.some((f) => f.key === key), `${s.id}: trait ${t} → missing field ${key}`);
  }
  for (const w of Object.keys(WEARABLES)) assert.ok(PROPS[w], `wearable ${w} has no prop`);
});

test("describe: colour fields are free, selects carry tags, the impossible is listed", () => {
  const d = describeStyle(micah);
  assert.equal(d.fields.find((f) => f.key === "hairColor").free, true);
  assert.deepEqual(d.fields.find((f) => f.key === "hairVariant").options.find((o) => o.value === "full").tags, ["long", "wavy", "shoulder length"]);
  assert.ok(d.cannot.some((c) => c.startsWith("hat ")));
  assert.ok(d.wear.includes("cap"));
});

test('"blue hair, a hat, no glasses, red clothes" on Micah: three fields, a worn cap, and Avataaars offered for the hat', () => {
  const r = applyEdit(micah, micah.defaults(), { ...ASK, wear: ["a hat"] }, { styles: STYLES });
  assert.equal(r.options.hairColor, "#3b82f6");
  assert.equal(r.options.glassesVariant, "none");
  assert.equal(r.options.shirtColor, "#dc2626");
  assert.deepEqual(r.wear, ["cap"]);
  assert.deepEqual(r.rejected.map((x) => x.trait), ["hat"]);
  assert.ok(r.rejected[0].alternatives[0].startsWith("wear: cap"));
  assert.deepEqual(r.switchable.map((s) => s.style), ["avataaars"]);
});

test("the same ask on Gaze: only the hat (worn) applies, and the rest is rejected with reasons", () => {
  const r = applyEdit(gaze, gaze.defaults(), { ...ASK, wear: ["hat"] }, { styles: STYLES });
  assert.deepEqual(r.applied.map((c) => c.key), ["wear"]);
  assert.deepEqual(r.rejected.map((x) => x.trait).sort(), ["glasses", "hairColor", "hat", "topColor"]);
  assert.ok(r.switchable.find((s) => s.style === "micah").has.includes("hairColor"));
});

test("selects resolve by value, label, tag words, and nearest alternatives are named", () => {
  assert.equal(applyEdit(micah, micah.defaults(), { traits: { hairStyle: "short swept back" } }).options.hairVariant, "fonze");
  assert.equal(applyEdit(micah, micah.defaults(), { traits: { hairStyle: "bald" } }).options.hairVariant, "mrClean");
  assert.match(applyEdit(avataaars, avataaars.defaults(), { traits: { hat: "beanie" } }).options.topVariant, /^winterHat/);
  assert.equal(applyEdit(avataaars, avataaars.defaults(), { traits: { glasses: "sunglasses" } }).options.accessoriesVariant, "sunglasses");
  const r = applyEdit(micah, micah.defaults(), { traits: { hairStyle: "dreadlocks" } });
  assert.equal(r.applied.length, 0);
  assert.equal(r.rejected[0].trait, "hairStyle");
  assert.ok(r.rejected[0].alternatives.length >= 3);
});

test("colours: hex, words, modifiers and a host palette", () => {
  assert.equal(resolveColor("#ABC"), "#aabbcc");
  assert.equal(resolveColor("blue"), "#3b82f6");
  assert.notEqual(resolveColor("dark blue"), resolveColor("blue"));
  assert.equal(resolveColor("brand purple", { "brand purple": "#7C3AED" }), "#7c3aed");
  assert.equal(resolveColor("nothing like a colour"), null);
  const r = applyEdit(micah, micah.defaults(), { fields: { hairColor: "greenish-ish" } });
  assert.equal(r.rejected[0].key, "hairColor");
});

test("switching styles carries shared traits and reports the lost ones", () => {
  const look = applyEdit(micah, micah.defaults(), { traits: { hairColor: "blue", glasses: "round", topColor: "red" } }).options;
  const to = carryTraits(micah, look, avataaars);
  assert.equal(to.options.hairColor, "#3b82f6");
  assert.equal(to.options.accessoriesVariant, "round");
  assert.equal(to.options.clothesColor, "#dc2626");
  const blob = carryTraits(micah, look, gaze);
  assert.ok(blob.lost.includes("hairColor") && blob.lost.includes("glasses"));
  assert.equal(blob.carried.length, 0);
});

test("deriveStyle + fillGradient: a themed Gaze in one call, still a valid style", async () => {
  const themed = deriveStyle(gaze, { id: "gradient", name: "Gradient", drop: ["bodyColor"], options: (o) => ({ ...gaze.defaults(), ...o, bodyColor: "#7c3aee" }), art: (a) => fillGradient(a, "#7c3aee", ["#7C3AED", "#EC4899"]) });
  assert.equal(themed.provenance.kind, "derive");
  assert.ok(!themed.fields.some((f) => f.key === "bodyColor"));
  assert.ok(!("bodyColor" in themed.traits));
  const art = await themed.render(themed.defaults());
  assert.match(art.faces.neutral, /<linearGradient id="aav-grad-/);
  assert.match(art.faces.neutral, /fill="url\(#aav-grad-/);
  assert.ok(!art.faces.neutral.includes("#7c3aee"));
  const issues = await lintStyle(themed);
  assert.deepEqual(issues.filter((i) => i.level === "error"), []);
});

test("composeStyle: an Avataaars hat on Micah, as data, with the credit union and a hat trait", async () => {
  const hats = composeStyle({ id: "micah-hats", name: "Micah with hats", base: micah, layers: [{ from: avataaars, part: "top", field: "topVariant", key: "hat", label: "Hat", only: ["hat", "winterHat1", "hijab"], fit: "crown", trait: "hat" }] });
  assert.equal(hats.traits.hat, "hat");
  assert.match(hats.credit.author, /Micah Lanier \+ Pablo Stanley/);
  assert.deepEqual(hats.provenance.from, ["micah", "avataaars"]);
  const plain = await hats.render(hats.defaults());
  assert.ok(!plain.faces.neutral.includes("aav-part-hat"));
  const r = applyEdit(hats, hats.defaults(), { traits: { hat: "beanie" } });
  assert.equal(r.options.hat, "winterHat1"); // the only beanie this composite offers
  const worn = await hats.render(r.options);
  assert.match(worn.faces.neutral, /<g transform="translate\([-\d.]+ [-\d.]+\) scale\([\d.]+\)"><g class="aav-part-hat">/);
  assert.match(worn.faces.happy, /aav-part-hat/);
  assert.ok(worn.parallax.hat > 0);
});

test("styleFromSpec builds the same two styles from JSON", async () => {
  const resolve = (id) => STYLES.find((s) => s.id === id);
  const g = styleFromSpec({ kind: "derive", id: "g", name: "G", from: "gaze", drop: ["bodyColor"], set: { bodyColor: "#7c3aee" }, gradient: { replace: "#7c3aee", stops: ["#7C3AED", "#EC4899"] } }, resolve);
  assert.match((await g.render(g.defaults())).faces.neutral, /linearGradient/);
  const c = styleFromSpec({ kind: "compose", id: "c", name: "C", base: "micah", layers: [{ from: "avataaars", part: "top", field: "topVariant", key: "hat", fit: "crown", trait: "hat" }] }, resolve);
  assert.equal(c.fields.at(-1).key, "hat");
  assert.throws(() => styleFromSpec({ kind: "derive", id: "x", name: "x", from: "nope" }, resolve), /unknown style "nope"/);
});

test("lint refuses scripts and missing credit; sanitize strips them", async () => {
  const bad = { id: "bad", name: "Bad", tier: "parts", credit: { author: "", license: "" }, fields: [], defaults: () => ({}),
    render: () => ({ id: "bad", tier: "parts", faces: { neutral: '<svg viewBox="0 0 10 10" onload="alert(1)"><script>x()</script><g class="aav-part-eyes"><circle r="1" fill="url(http://evil/x)"/></g><a href="https://x"></a></svg>' } }) };
  const issues = await lintStyle(bad);
  assert.ok(issues.some((i) => i.code === "credit"));
  assert.ok(issues.filter((i) => i.code === "unsafe").length >= 3);
  const clean = sanitizeArt(bad.render()).faces.neutral;
  assert.ok(!/<script|onload|http:\/\/evil|href="https/.test(clean));
  assert.match(clean, /aav-part-eyes/);
  const ok = await lintStyle(gaze);
  assert.deepEqual(ok.filter((i) => i.level === "error"), []);
});

test("renderStill and checkRecipe", async () => {
  assert.match(await renderStill(gaze, gaze.defaults(), "happy"), /^<svg/);
  const good = checkRecipe({ v: 1, style: "micah", options: micah.defaults(), wear: ["cap"] }, micah);
  assert.equal(good.ok, true);
  const bad = checkRecipe({ v: 1, style: "micah", options: { hairVariant: "nope", hairColor: "blue" }, wear: ["crown"] }, micah);
  assert.deepEqual(bad.ok, false);
  assert.equal(bad.problems.length, 3);
});

test("the aav CLI: new → edit → switch → check → render → lint, from a shell", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "aav-"));
  const bin = path.resolve("packages/awesome-agent-avatars/bin/aav.mjs");
  const run = (...args) => execFileSync(process.execPath, [bin, ...args], { encoding: "utf8", cwd: dir });
  try {
    const file = path.join(dir, "avatar.json");
    run("new", file, "--style", "micah", "--name", "Stitch");
    const edit = JSON.parse(run("edit", file, "--trait", "hairColor=blue", "--trait", "hat=cap", "--set", "glassesVariant=none", "--wear", "hat", "--json"));
    assert.equal(edit.recipe.options.hairColor, "#3b82f6");
    assert.deepEqual(edit.recipe.wear, ["cap"]);
    assert.equal(edit.rejected[0].trait, "hat");
    assert.equal(JSON.parse(readFileSync(file, "utf8")).options.glassesVariant, "none");
    const sw = JSON.parse(run("switch", file, "avataaars", "--json"));
    assert.equal(sw.recipe.style, "avataaars");
    assert.ok(sw.carried.includes("hairColor"));
    assert.match(run("check", file), /^ok:/);
    assert.match(run("render", file, "--face", "happy"), /^<svg/);
    run("style", "new", path.join(dir, "styles", "sunset"), "--derive", "gaze");
    assert.match(run("lint", path.join(dir, "styles", "sunset"), "--styles", path.join(dir, "styles")), /^ok:/);
    run("style", "new", path.join(dir, "styles", "blob"), "--module");
    assert.match(run("lint", path.join(dir, "styles", "blob")), /^ok:/);
    writeFileSync(path.join(dir, "styles", "blob", "style.mjs"), readFileSync(path.join(dir, "styles", "blob", "style.mjs"), "utf8").replace('<g class="aav-part-head">', '<script>x()</script><g class="aav-part-head">'));
    let refused;
    try { run("lint", path.join(dir, "styles", "blob")); } catch (e) { refused = e; }
    assert.equal(refused?.status, 2, "a style with a <script> must fail lint");
    assert.match(refused.stdout, /✗ unsafe:/);
    const list = JSON.parse(run("styles", "--styles", path.join(dir, "styles"), "--json"));
    assert.ok(list.some((s) => s.id === "sunset") && list.some((s) => s.id === "blob"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
