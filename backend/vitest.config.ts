import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // Integration con BD: no en `pnpm test` / CI (solo unit + API contrato).
    exclude: ['**/node_modules/**', '**/tests/integration/**', '**/dist/**'],
  },
});
