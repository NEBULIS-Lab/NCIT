import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || 8080);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.mp4': 'video/mp4' };

http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end(); return; }
  if (pathname.split('/').some(part => part.startsWith('.'))) { response.writeHead(404).end(); return; }
  let file = resolve(root, '.' + pathname);
  if (!file.startsWith(root + sep) && file !== root) { response.writeHead(403).end(); return; }
  let stat;
  try { stat = statSync(file); if (stat.isDirectory()) { file = resolve(file, 'index.html'); stat = statSync(file); } }
  catch { response.writeHead(404).end('Not found'); return; }
  if (!stat.isFile()) { response.writeHead(404).end(); return; }
  const headers = { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' };
  let start = 0, end = stat.size - 1, status = 200;
  if (request.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    if (!match || (!match[1] && !match[2])) { response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end(); return; }
    if (!match[1]) { start = Math.max(0, stat.size - Number(match[2])); }
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) { response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end(); return; }
    status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length'] = Math.max(0, end - start + 1);
  response.writeHead(status, headers);
  if (request.method === 'HEAD' || !stat.size) { response.end(); return; }
  const stream = createReadStream(file, {start, end});
  stream.on('error', () => response.destroy());
  response.on('close', () => stream.destroy());
  stream.pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`NCIT preview: http://127.0.0.1:${port}/`));
