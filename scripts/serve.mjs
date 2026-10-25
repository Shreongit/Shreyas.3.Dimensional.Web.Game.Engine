import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 4173);
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png" };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    const requested = pathname === "/" ? "/examples/rendering.html" : pathname;
    const target = path.resolve(root, `.${requested}`);
    if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403); res.end("Forbidden"); return; }
    const info = await stat(target);
    if (!info.isFile()) { res.writeHead(404); res.end("Not found"); return; }
    const body = await readFile(target);
    res.writeHead(200, { "Content-Type": mime[path.extname(target)] || "application/octet-stream", "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" });
    res.end(body);
  } catch { res.writeHead(404, { "Content-Type":"text/plain; charset=utf-8" }); res.end("Not found"); }
});
server.listen(port, "127.0.0.1", () => console.log(`S3DWGE demo: http://127.0.0.1:${port}/`));
const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);