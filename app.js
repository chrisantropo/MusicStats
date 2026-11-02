const http = require("http");
const fs = require("fs");
const path = require("path");

const port = parseInt(process.env.PORT || "3000", 10);
const outDir = path.join(__dirname, "out");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    const cleanUrl = (req.url || "/").split("?")[0];
    let filePath = path.join(outDir, cleanUrl === "/" ? "index.html" : cleanUrl);

    if (!path.extname(filePath)) {
      const htmlCandidate = filePath + ".html";
      if (fs.existsSync(htmlCandidate)) {
        filePath = htmlCandidate;
      } else {
        filePath = path.join(filePath, "index.html");
      }
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(outDir, "index.html");
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      });
      res.end(content);
    });
  })
  .listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
