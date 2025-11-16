import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

// Użyj lokalizacji pliku konfiguracyjnego jako bazę
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Katalog projektu to katalog gdzie znajduje się vitest.config.ts (wwwwww/)
const projectRoot = __dirname;

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    globals: true,
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      '**/.bun/**',
      '**/.cache/**',
      '**/AppData/**',
      '**/Google/Chrome/**',
      '**/Profile */**', // profile przeglądarki
      '**/Extensions/**', // rozszerzenia chrome
      '**/goober*/**',
      '**/global/**',
      '**/node_modules/**', // explicitly exclude all node_modules tests
      'e2e/**', // exclude E2E tests from Vitest
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/setup.ts',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'next-env.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': projectRoot,
    },
  },
});
