// Pure checks that need no browser: run after `npm run build`.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { defaultMotion, extendMotion, GROUPS, stateForTool, normalizeOptions, randomOptions, createStyleRegistry, pictureStyle, REACTIONS, PROPS } from "../packages/bot-styles/dist/index.js";
import { dicebearStyle, variantField, colorField, creditOf } from "../packages/bot-styles/dist/dicebear.js";

const require = createRequire(import.meta.url);

test("motion pack: 58 states, every clip, hand-off and prop exists", () => {
  const { states, clips } = defaultMotion;
  assert.equal(Object.keys(states).length, 58);
  for (const [id, r] of Object.entries(states)) {
    assert.ok(GROUPS.includes(r.group), `${id} group`);
    for (const c of [...r.clips, ...(r.compact || [])]) assert.ok(clips[c], `${id} clip ${c}`);
    if (r.next) assert.ok(states[r.next], `${id} next ${r.next}`);
    for (const p of [].concat(r.prop || [], r.wear || [])) assert.ok(PROPS[p], `${id} prop ${p}`);
    assert.equal(r.doc?.length, 3, `${id} doc`);
  }
  for (const [n, c] of Object.entries(clips)) {
    assert.ok(c.dur > 0, n);
    for (const keys of Object.values(c.tracks || {})) for (let i = 1; i < keys.length; i++) assert.ok(keys[i][0] >= keys[i - 1][0], `${n} keys in order`);
  }
  for (const r of Object.values(REACTIONS)) for (const p of r.props || []) assert.ok(PROPS[p], p);
});

test("extendMotion adds and overrides without touching the base", () => {
  const m = extendMotion(defaultMotion, { states: { blocked: { hold: 5 }, party: { clips: ["happyA"], face: "happy", group: "Custom" } } });
  assert.equal(m.states.blocked.hold, 5);
  assert.equal(defaultMotion.states.blocked.hold, 120);
  assert.ok(m.groups.includes("Custom"));
});

test("stateForTool guesses sensible states", () => {
  const cases = { web_search: "searching", read_file: "reading", edit_file: "coding", bash: "running", computer: "controlling", generate_image: "making", grep: "searching", run_tests: "running", unknown_thing: "working" };
  for (const [tool, state] of Object.entries(cases)) assert.equal(stateForTool(tool), state, tool);
});

const micahDef = JSON.parse(readFileSync(require.resolve("@dicebear/styles/micah.json"), "utf8"));
const micahLike = dicebearStyle({
  id: "micah-test", name: "Micah", definition: micahDef,
  fields: [variantField(micahDef, "hair", "Hair"), variantField(micahDef, "glasses", "Glasses", { optional: true }), colorField(micahDef, "base", "Skin")],
  defaults: () => ({ seed: "t", hairVariant: "fonze", glassesVariant: "none", baseColor: "#ac6651" }),
  faces: { neutral: { eyesVariant: "eyes", mouthVariant: "smile" }, happy: { eyesVariant: "smiling", mouthVariant: "laughing" } },
  skinKey: "baseColor",
});

test("dicebear adapter tags parts, keeps credit, maps None to probability 0", async () => {
  const art = await micahLike.render(micahLike.defaults());
  assert.match(art.faces.neutral, /class="bs-part-eyes"/);
  assert.match(art.faces.neutral, /class="bs-part-mouth"/);
  assert.doesNotMatch(art.faces.neutral, /bs-part-glasses"><[^/]/, "no glasses drawn when None");
  const withGlasses = await micahLike.render({ ...micahLike.defaults(), glassesVariant: "round" });
  assert.notEqual(withGlasses.faces.neutral, art.faces.neutral);
  assert.equal(art.skin, "#ac6651");
  assert.equal(creditOf(micahDef).author, "Micah Lanier");
  assert.equal(micahLike.credit.license, "CC BY 4.0");
});

test("editor helpers: normalise, randomise, registry recipes", async () => {
  const clean = normalizeOptions(micahLike, { hairVariant: "nope", glassesVariant: "round", extra: 1 });
  assert.equal(clean.hairVariant, "fonze");
  assert.equal(clean.glassesVariant, "round");
  assert.equal(clean.extra, undefined);
  assert.deepEqual(randomOptions(micahLike, "a"), randomOptions(micahLike, "a"));
  const reg = createStyleRegistry([micahLike, pictureStyle({ id: "pic", name: "Pic", src: "/a.png", credit: { author: "me", license: "MIT" } })]);
  const recipe = reg.recipe("micah-test");
  assert.deepEqual(Object.keys(recipe), ["v", "style", "options"]);
  const art = await reg.render(JSON.parse(JSON.stringify(recipe)));
  assert.ok(art.faces.happy);
  const pic = await reg.render(reg.recipe("pic"));
  assert.equal(pic.tier, "picture");
  assert.match(pic.faces.neutral, /src="\/a.png"/);
});

test("core is safe to import without a DOM (SSR)", async () => {
  assert.equal(typeof globalThis.document, "undefined");
  const m = await import("../packages/bot-styles/dist/index.js");
  assert.equal(typeof m.createAvatar, "function");
  const r = await import("../packages/bot-styles/dist/react.js");
  assert.equal(typeof r.AgentAvatar, "object", "React entry imports on the server");
});
