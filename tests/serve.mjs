// Tiny static server for the built site (tests and media recording).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".gif": "image/gif", ".json": "application/json", ".mp4": "video/mp4" };
export function serve(dir, port = 0) {
  const server = createServer(async (req, res) => {
    let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    let f = join(dir, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, "index.html"); res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(await readFile(f)); }
    catch { res.writeHead(404); res.end("not found"); }
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })));
}
