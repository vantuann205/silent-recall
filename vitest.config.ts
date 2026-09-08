import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},test:{include:['src/**/*.test.{ts,tsx}','contract/tests/**/*.test.ts','tests/**/*.test.ts'],environment:'node',coverage:{provider:'v8',include:['src/lib/**/*.ts','src/features/**/*.ts','src/features/**/*.tsx'],exclude:['**/*.test.*'],thresholds:{lines:75,functions:75,branches:70,statements:75}}}});
