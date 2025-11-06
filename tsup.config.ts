import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry points for different modules
  entry: {
    index: 'src/index.ts',
    'logger/index': 'src/logger/index.ts',
    'utils/index': 'src/utils/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'storage/index': 'src/storage/index.ts',
    'universalFile/index': 'src/universalFile/index.ts',
    'universalExport/index': 'src/universalExport/index.ts',
    'i18n/index': 'src/i18n/index.ts',
    'analytics/index': 'src/analytics/index.ts',
  },

  // Output formats: ESM and CJS
  format: ['esm', 'cjs'],

  // Generate TypeScript declaration files
  dts: true,

  // Split code for better tree-shaking
  splitting: true,

  // Generate sourcemaps for debugging
  sourcemap: true,

  // Clean output directory before build
  clean: true,

  // Minify output
  minify: false,

  // Target modern environments
  target: 'es2020',

  // External dependencies (not bundled)
  external: ['react', 'react-dom'],

  // Skip node_modules
  skipNodeModulesBundle: true,

  // Tree-shaking
  treeshake: true,

  // Output directory
  outDir: 'dist',

  // Preserve JSX for React
  // Not needed as we don't have JSX in this library yet, but good to have

  // Platform target
  platform: 'neutral', // Works in both browser and Node.js
});

