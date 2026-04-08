import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Hono();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`[RAILWAY] PhysioMotion server starting on port ${port}...`);

// Health check - CRITICAL for Railway
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    app: 'PhysioMotion'
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Find static files
const possiblePaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, '..', 'dist'),
  '/app/dist'
];

let staticPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    staticPath = p;
    console.log(`[RAILWAY] Serving static files from: ${p}`);
    break;
  }
}

if (staticPath) {
  // Serve static files from /static path
  app.use('/static/*', serveStatic({ root: path.join(staticPath, 'static') }));
  
  // Serve root index.html for root path
  app.get('/', (c) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return c.html(fs.readFileSync(indexPath, 'utf-8'));
    }
    return c.redirect('/static/login.html');
  });
  
  // Fallback to index.html for SPA routes
  app.get('*', (c) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return c.html(fs.readFileSync(indexPath, 'utf-8'));
    }
    // Try to serve from static folder
    const staticFile = path.join(staticPath, 'static', c.req.path);
    if (fs.existsSync(staticFile)) {
      return c.html(fs.readFileSync(staticFile, 'utf-8'));
    }
    return c.json({ error: 'Not found', path: c.req.path }, 404);
  });
} else {
  console.warn('[RAILWAY] No static files found');
  app.get('/', (c) => c.json({ 
    status: 'running',
    message: 'PhysioMotion API - no frontend',
    pathsChecked: possiblePaths
  }));
}

// CRITICAL: Bind to 0.0.0.0 for Railway
serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0'
}, (info) => {
  console.log(`✅ PhysioMotion server running on http://0.0.0.0:${port}`);
  console.log(`✅ Health check: http://0.0.0.0:${port}/api/health`);
});
