// Local server without any hosting CLI: serves public/ with clean URLs and runs the /api functions.
// Usage: npm run build && node --env-file=.env scripts/serve.mjs   (PORT defaults to 3000)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('../public', import.meta.url).pathname);
const apiDir = new URL('../api/', import.meta.url);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };
const handlers = {};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z]/g, '');
    try {
      handlers[name] = handlers[name] || (await import(new URL(name + '.js', apiDir))).default;
      return await handlers[name](req, res);
    } catch (e) {
      res.statusCode = e.code === 'ERR_MODULE_NOT_FOUND' ? 404 : 500; return res.end();
    }
  }
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index';
  let file = path.join(root, rel);
  if (!file.startsWith(root)) { res.statusCode = 400; return res.end(); }
  if (!path.extname(file)) file += '.html';
  let status = 200;
  if (!fs.existsSync(file)) { file = path.join(root, '404.html'); status = 404; }
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const port = Number(process.env.PORT || 3000);
server.listen(port, () => console.log(`Djanova Agro on http://localhost:${port}`));
