/**
 * Simple static file server for Firebase App Hosting
 *
 * Serves the built Vite app from the dist/ directory.
 * Required because App Hosting expects a server listening on PORT.
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8080;
const DIST_DIR = join(__dirname, 'dist');

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
};

async function serveFile(filePath, res) {
  try {
    const content = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    return true;
  } catch (err) {
    return false;
  }
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  let url = req.url || '/';

  // Remove query string
  url = url.split('?')[0];

  // Default to index.html for root
  if (url === '/') {
    url = '/index.html';
  }

  const filePath = join(DIST_DIR, url);

  // Try to serve the requested file
  if (await serveFile(filePath, res)) {
    return;
  }

  // For SPA routing: serve index.html for any non-file requests
  const indexPath = join(DIST_DIR, 'index.html');
  if (await fileExists(indexPath)) {
    await serveFile(indexPath, res);
    return;
  }

  // 404 fallback
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from ${DIST_DIR}`);
});
