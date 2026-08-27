/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Simplified for running outside Figma Make -- the original file imported
// './.figma/make/site.json' (Figma-only metadata) and included a few
// Figma-Make-specific dev plugins (site-title injection, HMR replay,
// a stories-kit route). None of that is needed to run the app normally.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/vitest.setup.ts',
    // ALT-VERIFICATION-V1-PART6: Playwright's e2e/*.spec.ts files use a
    // different test runner (@playwright/test) and must never be picked
    // up by Vitest's own discovery -- they share the .spec.ts naming
    // convention but are not compatible test frameworks.
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/hooks/**'],
    },
  },
})
