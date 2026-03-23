import { serve } from '@hono/node-server';
import { Pool } from 'pg';
import { createPostgresAdapter } from './src/db';
import app from './src/index';

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
  // Inject database into context
  if (db) {
    c.env = { ...c.env, DB: db };
  }
  await next();
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
