import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // Single-page app: every path is served the fallback page and the router takes over.
    sveltekit({ adapter: adapter({ fallback: '200.html' }) }),
    svelteTesting(),
  ],
  server: {
    // The API is another origin, so there is no CORS setup to do in development.
    proxy: { '/api': 'http://localhost:3000' },
  },
  test: {
    environment: 'jsdom',
    css: true,
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
});
