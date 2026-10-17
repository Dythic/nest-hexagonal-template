import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const fromRoot = (relativePath: string): string => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: {
    alias: {
      '@domain': fromRoot('./src/domain'),
      '@application': fromRoot('./src/application'),
      '@infrastructure': fromRoot('./src/infrastructure'),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts'],
    },
  },
});
