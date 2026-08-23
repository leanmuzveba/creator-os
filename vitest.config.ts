import { defineConfig } from 'vitest/config';

// Vitest configuration. Uses a plain Node environment (the tested modules are
// pure logic with no DOM dependency) and its own config so the app's Vite
// plugins (React, Tailwind) don't load during unit tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    globals: false,
  },
});
