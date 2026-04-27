// Minimal local static server for PWA testing.
// Usage:  node _extracted/_serve.js   (optionally: node _extracted/_serve.js 8081)
// Serves the repo root over HTTP so <link rel="manifest"> and
// icon/apple-touch-icon relative paths actually resolve (file:// won't).

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/manifest+json; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
};

http.createServer((req, res) => {
  let pathname = decodeURIComponent(url.parse(req.url).pathname);

  // Directory listing (root only) — helps you find the variant HTML files
  if (pathname === '/' || pathname === '') {
    const entries = fs.readdirSync(ROOT)
      .filter(n => !n.startsWith('.') && !n.startsWith('_'))
      .map(n => {
        const stat = fs.statSync(path.join(ROOT, n));
        const href = '/' + encodeURIComponent(n) + (stat.isDirectory() ? '/' : '');
        const size = stat.isDirectory() ? '—' : `${(stat.size/1024).toFixed(1)} KB`;
        return `<li><a href="${href}">${n}</a> <span style="color:#888">${size}</span></li>`;
      }).join('');
    const html = `<!doctype html><meta charset="utf-8"><title>${path.basename(ROOT)}</title>
      <style>body{font:14px/1.5 system-ui;margin:2em;max-width:780px}li{margin:.3em 0}a{color:#0a58ca;text-decoration:none}a:hover{text-decoration:underline}</style>
      <h1>${path.basename(ROOT)}</h1><p style="color:#666">Local PWA test server on port ${PORT}</p>
      <ul>${entries}</ul>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  const filePath = path.join(ROOT, pathname);
  // Refuse anything that escaped the root
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Not found: ${pathname}`);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',  // always serve fresh during testing
    });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, () => {
  console.log(`Serving ${ROOT}`);
  console.log(`→  http://localhost:${PORT}/`);
  console.log(`→  http://localhost:${PORT}/Wheel%20of%20Fortune%20-%20web%20(1-12-pwa).html`);
  console.log(`\nStop with Ctrl+C.`);
});
