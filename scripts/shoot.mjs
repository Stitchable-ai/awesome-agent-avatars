// Screenshots of the built site for review: node scripts/shoot.mjs <outDir>
import { chromium } from "playwright";
import { serve } from "../tests/serve.mjs";

const out = process.argv[2] || "/tmp/bot-styles-shots";
const { url, close } = await serve(new URL("../site/dist/", import.meta.url).pathname);
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
for (const [path, name, w, h, full] of [["/", "landing", 1280, 900, true], ["/playground.html", "playground", 1280, 900, true], ["/editor.html", "editor", 1280, 860, false], ["/playground.html#worn", "worn", 1500, 700, true], ["/playground.html#react", "react", 1500, 700, true]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on("pageerror", (e) => console.log("ERR", path, e.message));
  await p.goto(url + path); await p.waitForTimeout(2200);
  await p.screenshot({ path: `${out}/${name}.png`, fullPage: full }); await p.close();
}
await b.close(); close(); console.log("ok");
