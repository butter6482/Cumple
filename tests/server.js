// Servidor estático sin dependencias para desarrollo y tests.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8"
};

function notFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("404 Not Found");
}

http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      return notFound(res);
    }
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = path.join(ROOT, pathname);
    if (!file.startsWith(ROOT + path.sep)) return notFound(res);

    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) return notFound(res);
      const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
      const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" };
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");

      if (range) {
        let start = range[1] ? Number(range[1]) : NaN;
        let end = range[2] ? Number(range[2]) : stat.size - 1;
        if (isNaN(start)) { start = stat.size - end; end = stat.size - 1; } // bytes=-N
        end = Math.min(end, stat.size - 1);
        if (start < 0 || start > end) {
          res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
          return res.end();
        }
        res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
        if (req.method === "HEAD") return res.end();
        return fs.createReadStream(file, { start, end }).pipe(res);
      }

      res.writeHead(200, { ...headers, "Content-Length": stat.size });
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(file).pipe(res);
    });
  })
  .listen(PORT, () => console.log(`Sirviendo en http://localhost:${PORT}/?preview=1`));
