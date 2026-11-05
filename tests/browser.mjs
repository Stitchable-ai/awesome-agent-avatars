// End-to-end checks in headless Chromium against the built site (npm run build:site first).
// Drives the playground with a real pointer and checks engine state after each interaction,
// checks every state on every style renders without errors, and exercises the editor.
import { chromium } from "playwright";
import { serve } from "./serve.mjs";

const root = new URL("../site/dist/", import.meta.url).pathname;
const { url, close } = await serve(root);
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let failed = 0;
const ok = (name, cond, info) => { if (!cond) failed++; console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + JSON.stringify(info))); };
const errors = [];
const page = async (path, viewport = { width: 1280, height: 900 }) => {
  const p = await b.newPage({ viewport });
  p.on("pageerror", (e) => errors.push(path + ": " + e.message));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(path + ": " + m.text()));
  await p.goto(url + path); return p;
};

// ---- playground interactions ----
const p = await page("/playground.html");
await p.waitForFunction(() => window.BS_PAGE?.avs?.length === 5);
await p.waitForTimeout(500);
const st = (i) => p.evaluate((i) => { const a = BS_PAGE.avs[i], r = a.root; return { state: a.state, props: [...r.querySelectorAll(".bs-prop")].map((e) => e.dataset.p), back: r.classList.contains("back"), drag: r.querySelector(".bs-drag").style.transform }; }, i);
const box = async (i) => (await p.$$(".card .bs-av"))[i].boundingBox();
let B = await box(0);
await p.mouse.move(B.x + B.width * 0.9, B.y + B.height * 0.2, { steps: 5 }); await p.waitForTimeout(700);
const tf = await p.evaluate(() => BS_PAGE.avs[0].root.querySelector(".bs-body").style.transform);
ok("hover turns the head toward the pointer", /rotateY\((\d+\.?\d*)deg\)/.test(tf) && +tf.match(/rotateY\(([-\d.]+)deg/)[1] > 3, tf);
await p.mouse.down(); await p.mouse.move(B.x + B.width * 0.95, B.y + B.height * 0.3, { steps: 4 });
await p.mouse.move(B.x + B.width * 0.4, B.y + B.height * 0.4, { steps: 6 }); await p.waitForTimeout(80);
let s = await st(0); ok("drag enters dragging and swings", s.state === "dragging" && /rotate\((?!0deg)/.test(s.drag), s);
await p.mouse.up(); await p.waitForTimeout(60); s = await st(0); ok("release goes back to idle", s.state === "idle", s);
await p.waitForTimeout(800);
await p.mouse.click(B.x + B.width / 2, B.y + B.height / 2); await p.waitForTimeout(90); await p.mouse.click(B.x + B.width / 2, B.y + B.height / 2); await p.waitForTimeout(420);
s = await st(0); ok("double-click: spin shows the back, sparkles", s.back || s.props.includes("sparkle"), s);
await p.waitForTimeout(1500);
B = await box(1); await p.mouse.move(B.x + B.width * 0.4, B.y + B.height * 0.3);
for (let k = 0; k < 7; k++) { await p.mouse.move(B.x + B.width * (k % 2 ? 0.35 : 0.65), B.y + B.height * 0.3, { steps: 3 }); await p.waitForTimeout(40); }
s = await st(1); ok("rubbing: blush + hearts", s.props.includes("blush") && s.props.includes("hearts"), s);
B = await box(2); for (let k = 0; k < 5; k++) { await p.mouse.click(B.x + B.width / 2, B.y + B.height / 2); await p.waitForTimeout(330); }
await p.waitForTimeout(200); s = await st(2); ok("five quick clicks: steam", s.props.includes("steam"), s);
await p.mouse.move(640, 890); await p.click("#ask"); await p.keyboard.type("hello", { delay: 30 });
s = await st(3); ok("typing: listening", s.state === "listening", s);
await p.keyboard.press("Enter"); await p.waitForTimeout(200); s = await st(3); ok("Enter: sending", s.state === "sending", s);
const seen = new Set(); for (let k = 0; k < 44; k++) { seen.add((await st(3)).state); await p.waitForTimeout(500); }
ok("a full turn passes every step", ["thinking", "searching", "reading", "coding", "running", "streaming", "finished", "idle"].every((x) => seen.has(x)), [...seen]);
await p.click("#need"); await p.waitForTimeout(2500); s = await st(0); ok("needs approval: hand + ? bubble", s.state === "blocked" && s.props.includes("hand") && s.props.includes("ask"), s);
await p.click("#approve"); await p.waitForTimeout(300); s = await st(0); ok("approve: approving", s.state === "approving", s);
await p.evaluate(() => BS_PAGE.avs[0].setState("thinking"));
const swapped = await p.evaluate(async () => { const before = BS_PAGE.avs[0].root.querySelector(".bs-art").innerHTML.length; document.querySelector("#swap button").click(); await new Promise((r) => setTimeout(r, 200)); const a = BS_PAGE.avs[0]; return { state: a.state, changed: a.root.querySelector(".bs-art").innerHTML.length !== before }; });
ok("hot-swap keeps the state", swapped.state === "thinking" && swapped.changed, swapped);
await p.close();

// ---- every state on every style renders ----
for (const g of ["Lifecycle", "Reactions", "Indicators", "Moments,Showcase"]) {
  const q = await page("/playground.html#matrix=" + g, { width: 2400, height: 900 });
  await q.waitForTimeout(1500);
  const n = await q.evaluate(() => document.querySelectorAll(".bs-av").length);
  const blank = await q.evaluate(() => [...document.querySelectorAll(".bs-av")].filter((a) => !a.querySelector(".bs-art").children.length).length);
  ok(`sheet ${g}: ${n} tiles, none blank`, n > 0 && blank === 0, { n, blank });
  await q.close();
}

// ---- editor: fields drive the art; the recipe is JSON ----
const e = await page("/editor.html");
await e.waitForSelector(".bse-stage .bs-av .bs-art svg, .bse-stage .bs-av .bs-art img", { timeout: 15000 });
const before = await e.evaluate(() => document.querySelector(".bse-stage .bs-art").innerHTML);
await e.click(".bse-swatches button:nth-child(5)"); await e.waitForTimeout(600);
const after = await e.evaluate(() => document.querySelector(".bse-stage .bs-art").innerHTML);
ok("editor: changing a field re-renders the art", before !== after);
for (const name of ["Avataaars", "Nice Avatar", "Gaze", "Fluent Emoji 3D", "Micah"]) {
  await e.click(`.bse-styles button:has-text("${name}")`); await e.waitForTimeout(500);
  const has = await e.evaluate(() => !!document.querySelector(".bse-stage .bs-art svg, .bse-stage .bs-art img, .bse-stage .bs-art div"));
  ok(`editor: ${name} renders`, has);
}
const recipe = await e.evaluate(() => JSON.parse(document.querySelector(".bse details pre").textContent));
ok("editor: recipe is { v, style, options }", recipe.v === 1 && recipe.style === "micah" && typeof recipe.options === "object", recipe);
await e.close();

// ---- landing ----
const l = await page("/");
await l.waitForTimeout(1200);
ok("landing: five hero avatars", (await l.evaluate(() => document.querySelectorAll("#hero .bs-av").length)) === 5);
await l.close();

console.log(errors.length ? "ERRORS\n" + errors.join("\n") : "NO_ERRORS");
await b.close(); close();
process.exit(failed || errors.length ? 1 : 0);
