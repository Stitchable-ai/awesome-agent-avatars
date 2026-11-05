// Records the README demos from the built site: GIFs (via ffmpeg) and still sheets.
//   npm run build:site && node scripts/record-media.mjs
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, renameSync } from "node:fs";
import { serve } from "../tests/serve.mjs";

const root = new URL("..", import.meta.url).pathname;
const media = root + "media/", tmp = "/tmp/bot-styles-media/";
mkdirSync(media, { recursive: true }); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
const { url, close } = await serve(root + "site/dist/");
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const only = process.argv[2];

async function clip(name, path, viewport, selector, act, { width = 720, fps = 14, colors = 128 } = {}) {
  if (only && only !== name) return;
  const dir = tmp + name + "/"; mkdirSync(dir, { recursive: true });
  const ctx = await b.newContext({ viewport, recordVideo: { dir, size: viewport } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log("ERR", name, e.message));
  await p.goto(url + path); await p.waitForTimeout(1500);
  const el = await p.$(selector); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const bx = await el.boundingBox();
  const t0 = Date.now(); await act(p, bx); const dur = (Date.now() - t0) / 1000;
  await ctx.close();
  const webm = dir + readdirSync(dir).find((f) => f.endsWith(".webm"));
  // the clip starts after page load: keep only the acted part
  const total = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", webm]).toString();
  const start = Math.max(0, total - dur - 0.1);
  const crop = `crop=${Math.round(bx.width)}:${Math.round(bx.height)}:${Math.round(bx.x)}:${Math.round(bx.y)}`;
  const vf = `${crop},fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${colors}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(start), "-i", webm, "-vf", vf, "-loop", "0", media + name + ".gif"]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(start), "-i", webm, "-vf", `${crop},scale=trunc(iw/2)*2:trunc(ih/2)*2`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-movflags", "+faststart", media + name + ".mp4"]);
  console.log("recorded", name, dur.toFixed(1) + "s");
}
const wait = (p, ms) => p.waitForTimeout(ms);
const glide = async (p, pts, steps = 22, pause = 160) => { for (const [x, y] of pts) { await p.mouse.move(x, y, { steps }); await wait(p, pause); } };

// 1. hero: five styles, one engine: gaze, then a full agent turn
await clip("hero", "/", { width: 1280, height: 760 }, ".hero > div:nth-child(2)", async (p, bx) => {
  const at = (fx, fy) => [bx.x + bx.width * fx, bx.y + bx.height * fy];
  await glide(p, [at(0.05, 0.05), at(0.95, 0.1), at(0.5, 0.75), at(0.1, 0.6), at(0.9, 0.5)]);
  await p.click("#ask"); await p.keyboard.type("make a launch video", { delay: 40 }); await wait(p, 400);
  await p.keyboard.press("Enter"); await p.mouse.move(bx.x + bx.width * 0.5, bx.y - 40, { steps: 6 });
  await wait(p, 12500);
}, { width: 560, fps: 10, colors: 96 });
// 2. interactions on the playground cards
await clip("interactions", "/playground.html", { width: 1280, height: 520 }, "#gal", async (p, bx) => {
  const cards = await p.$$(".card .bs-av"), B = []; for (const c of cards) B.push(await c.boundingBox());
  const at = (i, fx, fy) => [B[i].x + B[i].width * fx, B[i].y + B[i].height * fy];
  await glide(p, [at(0, 0.1, 0.1), at(2, 0.5, 0.9), at(4, 0.9, 0.1)]);
  await p.mouse.click(...at(0, 0.5, 0.5)); await wait(p, 600);
  await p.mouse.click(...at(3, 0.5, 0.5)); await wait(p, 80); await p.mouse.click(...at(3, 0.5, 0.5)); await wait(p, 1600);
  await p.mouse.move(...at(1, 0.5, 0.35)); await p.mouse.down();
  await glide(p, [at(1, 0.9, 0.3), at(1, 0.15, 0.4), at(1, 0.85, 0.25), at(1, 0.5, 0.35)], 9, 110); await p.mouse.up(); await wait(p, 1000);
  await p.mouse.move(...at(2, 0.4, 0.3)); for (let k = 0; k < 8; k++) { await p.mouse.move(...at(2, k % 2 ? 0.35 : 0.65, 0.3), { steps: 3 }); await wait(p, 40); }
  await wait(p, 1600);
  for (let k = 0; k < 5; k++) { await p.mouse.click(...at(4, 0.5, 0.5)); await wait(p, 300); }
  await wait(p, 1800);
});
// 3. hot-swap: one avatar keeps its state while the style changes
await clip("hotswap", "/", { width: 1280, height: 800 }, ".swap", async (p) => {
  await p.click('#chips button:has-text("Working")'); await wait(p, 1500);
  for (const n of ["Avataaars", "Nice Avatar", "Gaze", "Fluent Emoji 3D", "Micah"]) { await p.click(`#solo-styles button:has-text("${n}")`); await wait(p, 1300); }
  await p.click('#chips button:has-text("Celebrate")'); await wait(p, 1200);
  for (const n of ["Gaze", "Avataaars"]) { await p.click(`#solo-styles button:has-text("${n}")`); await wait(p, 1200); }
}, { width: 760 });
// 4. editor: pick styles, change fields, randomise
await clip("editor", "/editor.html", { width: 1280, height: 860 }, ".bse", async (p) => {
  await wait(p, 400);
  for (const k of [1, 3, 5, 6]) { await p.click(`.bse fieldset:nth-of-type(1) .bse-swatches button:nth-child(${k})`); await wait(p, 500); }
  await p.click('.bse-seg button:has-text("Square")'); await wait(p, 600);
  await p.selectOption(".bse select", { index: 2 }); await wait(p, 700);
  await p.click('.bse-styles button:has-text("Avataaars")'); await wait(p, 900);
  await p.click('.bse-actions button:has-text("Randomise")'); await wait(p, 1100);
  await p.click('.bse-actions button:has-text("Randomise")'); await wait(p, 1100);
  await p.click('.bse-styles button:has-text("Gaze")'); await wait(p, 900);
  for (const k of [1, 3, 5]) { await p.click(`.bse .bse-swatches button:nth-child(${k})`); await wait(p, 450); }
  await p.click('.bse-chips button:has-text("celebrate")'); await wait(p, 1800);
}, { width: 820 });

// stills
if (!only || only === "stills") {
  for (const [hash, name, w] of [["matrix=Lifecycle", "states-lifecycle", 2320], ["matrix=Reactions", "states-reactions", 2320], ["matrix=Indicators", "states-indicators", 1840], ["matrix=Moments,Showcase", "states-moments", 1460], ["react", "reactions", 1500], ["worn", "worn-props", 1500]]) {
    const p = await b.newPage({ viewport: { width: w, height: 700 } });
    await p.goto(url + "/playground.html#" + hash); await p.waitForTimeout(1800);
    await p.screenshot({ path: media + name + ".png", fullPage: true }); await p.close();
  }
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto(url + "/"); await p.waitForTimeout(2200);
  await p.screenshot({ path: root + "site/public/og.png" }); await p.close();
}
await b.close(); close();
