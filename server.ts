import { serve } from '@hono/node-server';
import app from './src/index.js';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`[PHYSIOMOTION] Server starting on port ${port}...`);
console.log(`[PHYSIOMOTION] Environment: ${process.env.NODE_ENV || 'development'}`);

// Determine the correct static files path
const possiblePaths = [
  path.join(__dirname, 'dist', 'static'),
  path.join(__dirname, 'public', 'static'),
  path.join(__dirname, 'static'),
  path.join(process.cwd(), 'dist', 'static'),
  path.join(process.cwd(), 'public', 'static'),
];

let staticPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    staticPath = testPath;
    console.log(`[PHYSIOMOTION] Found static files at: ${staticPath}`);
    break;
  }
}

if (!staticPath) {
  console.warn('[PHYSIOMOTION] Static files not found in expected locations');
  staticPath = path.join(__dirname, 'public', 'static');
}

// Serve static files with proper MIME types
app.use('/static/*', async (c, next) => {
  const filePath = c.req.path.replace('/static/', '');
  const fullPath = path.join(staticPath, filePath);
  
  // Security: prevent directory traversal
  if (!fullPath.startsWith(staticPath)) {
    return c.json({ error: 'Invalid path' }, 403);
  }
  
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      '.js': 'application/javascript',
      '.mjs': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
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
      '.mp4': 'video/mp4',
      '.webm': 'video/webm'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const content = fs.readFileSync(fullPath);
    
    c.header('Content-Type', contentType);
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(content);
  }
  
  await next();
});

// Serve HTML pages
const servePage = (pageName) => {
  const possiblePagePaths = [
    path.join(__dirname, 'public', `${pageName}.html`),
    path.join(__dirname, 'dist', `${pageName}.html`),
    path.join(__dirname, `${pageName}.html`),
    path.join(staticPath, `${pageName}.html`),
    path.join(process.cwd(), 'public', `${pageName}.html`),
  ];
  
  for (const pagePath of possiblePagePaths) {
    if (fs.existsSync(pagePath)) {
      return fs.readFileSync(pagePath, 'utf-8');
    }
  }
  return null;
};

// Routes for specific pages
app.get('/login', (c) => {
  const content = servePage('login');
  if (content) return c.html(content);
  return c.redirect('/');
});

app.get('/assessment', (c) => {
  const content = servePage('assessment');
  if (content) return c.html(content);
  return c.json({ error: 'Assessment page not found' }, 404);
});

app.get('/patients', (c) => {
  const content = servePage('patients');
  if (content) return c.html(content);
  return c.json({ error: 'Patients page not found' }, 404);
});

app.get('/dashboard', (c) => {
  const content = servePage('dashboard');
  if (content) return c.html(content);
  return c.json({ error: 'Dashboard page not found' }, 404);
});

app.get('/intake', (c) => {
  const content = servePage('intake');
  if (content) return c.html(content);
  return c.json({ error: 'Intake page not found' }, 404);
});

// Root path - serve main app or redirect to login
app.get('/', (c) => {
  const indexPaths = [
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, 'index.html'),
    path.join(staticPath, 'index.html'),
  ];
  
  for (const indexPath of indexPaths) {
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      return c.html(content);
    }
  }
  
  // Fallback to login
  const loginContent = servePage('login');
  if (loginContent) return c.html(loginContent);
  
  return c.json({ 
    status: 'PhysioMotion API Running',
    message: 'Frontend not built. Run build command.',
    endpoints: ['/api/health', '/api/patients', '/api/assessments']
  });
});

// Log registered routes
console.log('[PHYSIOMOTION] Registered routes:');
app.routes.forEach((route) => {
  console.log(`  ${route.method} ${route.path}`);
});

// Start server
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`[PHYSIOMOTION] ✅ Server running at http://localhost:${info.port}`);
  console.log(`[PHYSIOMOTION] API available at http://localhost:${info.port}/api`);
});

export default app;
