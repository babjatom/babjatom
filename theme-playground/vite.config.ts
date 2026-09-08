import path from 'node:path'
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/** GitHub Pages serves 404.html for unknown paths — reuse the SPA shell. */
function spaFallback(): Plugin {
  return {
    name: 'spa-github-pages-fallback',
    closeBundle() {
      const dist = path.resolve(rootDir, 'dist')
      copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'))
    },
  }
}

export default defineConfig({
  base: '/babjatom/',
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: true,
  },
})
