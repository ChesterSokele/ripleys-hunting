import { defineConfig } from 'vite';
import fs from 'node:fs';
import { resolve } from 'node:path';

// Every generated page is its own Vite entry (multi-page site). The list is written by scripts/build-pages.mjs.
const pages = fs.existsSync('data/pages.json') ? JSON.parse(fs.readFileSync('data/pages.json', 'utf8')) : ['index.html'];

export default defineConfig({
  // './' keeps every URL relative, so the build works at a domain root, in a sub-folder or on any static host.
  base: './',
  build: {
    target: 'es2020',
    cssMinify: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: Object.fromEntries(pages.map(p => [p.replace(/\.html$/, '').replace(/\//g, '-'), resolve(process.cwd(), p)])),
    },
  },
  server: { host: true, port: 5173 },
  preview: { port: 4173 },
});
