import { serve } from '@hono/node-server';
import app from './src/index';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`Server starting on port ${port}...`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Log all registered routes
const routes: string[] = [];
app.routes.forEach((route) => {
  routes.push(`${route.method} ${route.path}`);
});
console.log(`Registered routes: ${routes.length}`);
routes.forEach(r => console.log(`  ${r}`));

serve({
  fetch: app.fetch,
  port
});

console.log(`Server is running on http://localhost:${port}`);
