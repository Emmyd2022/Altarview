/// <reference types="vitest" />
import { defineConfig, defaultExclude } from 'vitest/config'
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
    // ALT-V2-CORRECTION-PART1: previously a custom array that REPLACED
    // Vitest's own sensible default excludes (dist, .git, etc.) instead
    // of extending them -- also apparently insufficient on at least one
    // real Windows machine to keep e2e/*.spec.ts out of Vitest's
    // discovery. Fixed properly: spread Vitest's own `defaultExclude`
    // (the documented way to ADD to defaults rather than replace them)
    // and list the e2e folder redundantly in three equivalent glob
    // forms, removing any ambiguity about glob-matching edge cases.
    exclude: [...defaultExclude, 'e2e/**', 'e2e/**/*', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/hooks/**'],
    },
  },
})
