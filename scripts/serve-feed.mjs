/**
 * Serves feed/ over HTTP so you can test the "Ibyongewe" screen locally.
 *
 *   npm run feed:build
 *   npm run feed
 *   -> paste http://127.0.0.1:8788/manifest.json into the app
 *
 * In production host the same folder anywhere static (GitHub Pages, S3,
 * Cloudflare Pages, your own server). Update feed.json with the public URL.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "feed");
const port = Number(process.env.PORT ?? 8788);

const TYPES = {
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
  const file = join(root, rel || "manifest.json");
  if (!file.startsWith(root)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  try {
    const body = await readFile(file);
    const ext = file.slice(file.lastIndexOf("."));
    res.writeHead(200, {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Content-Length": body.length,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    });
    res.end(body);
    console.log(`${req.method} ${url.pathname} -> 200 (${body.length} B)`);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("not found");
    console.log(`${req.method} ${url.pathname} -> 404`);
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Feed: http://127.0.0.1:${port}/manifest.json`);
});
