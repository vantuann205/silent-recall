import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: [
      'src/**/*.test.{ts,tsx}',
      'contract/tests/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.ts',
        'src/features/**/*.{ts,tsx}',
        'src/providers/**/*.tsx',
        'src/components/shared/**/*.tsx',
      ],
      exclude: ['**/*.test.*'],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75,
        'src/lib/{validation,crypto}/**/*.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 90,
        },
        'src/lib/midnight/{contract-gateway,mapping,private-state}.ts': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 85,
        },
      },
    },
  },
});
