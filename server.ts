import { serve } from '@hono/node-server';
import { Pool } from 'pg';
import { createPostgresAdapter } from './src/db';
import app from './src/index';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`[RAILWAY] Server starting on port ${port}...`);
console.log(`[RAILWAY] Environment: ${process.env.NODE_ENV || 'development'}`);

// Initialize PostgreSQL connection
let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    db = createPostgresAdapter(pool);
    console.log('[RAILWAY] PostgreSQL database adapter initialized');
  } catch (error) {
    console.error('[RAILWAY] Failed to initialize PostgreSQL:', error);
  }
} else {
  console.warn('[RAILWAY] DATABASE_URL not set - database features will be unavailable');
}

// Create middleware to inject DB into context
app.use('*', async (c, next) => {
  if (db) {
    c.env = { ...c.env, DB: db };
  }
  await next();
});

// Serve static files from dist folder
const distPath = path.join(__dirname, 'dist');
console.log(`[RAILWAY] Serving static files from: ${distPath}`);

// Serve static assets
app.use('/static/*', serveStatic({ root: './dist/static' }));
app.use('/assets/*', serveStatic({ root: './dist/assets' }));

// Root path - serve index.html or redirect to login
app.get('/', (c) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return c.html(fs.readFileSync(indexPath, 'utf-8'));
  }
  // Fallback to login.html
  const loginPath = path.join(distPath, 'static', 'login.html');
  if (fs.existsSync(loginPath)) {
    return c.html(fs.readFileSync(loginPath, 'utf-8'));
  }
  return c.json({ error: 'Frontend not found' }, 500);
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (c) => {
  // Skip API routes
  if (c.req.path.startsWith('/api/') || c.req.path === '/api') {
    return c.json({ error: 'API route not found' }, 404);
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return c.html(fs.readFileSync(indexPath, 'utf-8'));
  }
  
  // Try static folder
  const staticPath = path.join(distPath, 'static', c.req.path === '/' ? 'login.html' : c.req.path);
  if (fs.existsSync(staticPath)) {
    const content = fs.readFileSync(staticPath, 'utf-8');
    return c.html(content);
  }
  
  return c.json({ error: 'Not found', path: c.req.path }, 404);
});

// Log all registered routes
const routes: string[] = [];
app.routes.forEach((route) => {
  routes.push(`${route.method} ${route.path}`);
});
console.log(`[RAILWAY] Registered routes: ${routes.length}`);
routes.slice(0, 20).forEach(r => console.log(`  ${r}`));
if (routes.length > 20) {
  console.log(`  ... and ${routes.length - 20} more`);
}

serve({
  fetch: app.fetch,
  port
});

console.log(`[RAILWAY] Server is running on http://localhost:${port}`);
