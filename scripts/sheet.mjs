// Screenshot one playground sheet: node scripts/sheet.mjs <hash> <out.png> [width] [scale]
// e.g. node scripts/sheet.mjs arms /tmp/arms.png 1300 2   (run npm run build:site first)
import { chromium } from "playwright";
import { serve } from "../tests/serve.mjs";

const [hash, out, width = "1500", scale = "1"] = process.argv.slice(2);
const { url, close } = await serve(new URL("../site/dist/", import.meta.url).pathname);
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const p = await b.newPage({ viewport: { width: +width, height: 600 }, deviceScaleFactor: +scale });
p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto(`${url}/playground.html#${hash}`);
await p.waitForTimeout(1800);
await p.screenshot({ path: out, fullPage: true });
await b.close(); close();
console.log("wrote", out);
