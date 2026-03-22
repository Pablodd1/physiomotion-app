import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'

export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/index.tsx'
    })
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      input: './server.ts',
      output: {
        format: 'esm',
        dir: 'dist',
        entryFileNames: 'server.js'
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'zod', 'bcryptjs']
  },
  server: {
    port: 3000,
    host: true
  }
})
