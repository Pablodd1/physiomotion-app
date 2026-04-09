import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.tsx')
      },
      output: {
        entryFileNames: 'src/index.js',
        format: 'esm'
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'zod', 'bcryptjs', 'pg']
  },
  server: {
    port: 3000,
    host: true
  }
})
