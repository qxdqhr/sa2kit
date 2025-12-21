import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry points for different modules
  entry: {
    index: 'src/index.ts',
    'logger/index': 'src/logger/index.ts',
    'utils/index': 'src/utils/index.ts',
    'storage/index': 'src/storage/index.ts',
    'request/index': 'src/request/index.ts',
    'api/index': 'src/api/index.ts',
    'universalFile/index': 'src/universalFile/index.ts',
    'universalFile/server/index': 'src/universalFile/server/index.ts',
    'universalExport/index': 'src/universalExport/index.ts',
    'universalExport/server/index': 'src/universalExport/server/index.ts',
    'i18n/index': 'src/i18n/index.ts',
    'analytics/index': 'src/analytics/index.ts',
    'analytics/server/index': 'src/analytics/server/index.ts',
    'auth/index': 'src/auth/index.ts',
    'auth/schema/index': 'src/auth/schema/index.ts',
    'auth/services/index': 'src/auth/services/index.ts',
    'auth/routes/index': 'src/auth/routes/index.ts',
    'auth/middleware/index': 'src/auth/middleware/index.ts',
    'auth/hooks/index': 'src/auth/hooks/index.ts',
    'auth/client/index': 'src/auth/client/index.ts',
    'auth/components/index': 'src/auth/components/index.ts',
    'config/index': 'src/config/index.ts',
    'config/server/index': 'src/config/server/index.ts',
    'mmd/index': 'src/mmd/index.ts',
    'mmd/admin/index': 'src/mmd/admin/index.ts',
    'mmd/server/index': 'src/mmd/server/index.ts',
    'audioDetection/index': 'src/audioDetection/index.ts',
    'imageCrop/index': 'src/imageCrop/index.ts',
    'testYourself/index': 'src/testYourself/index.ts',
    'testYourself/admin/index': 'src/testYourself/admin/index.ts',
    'testYourself/server/index': 'src/testYourself/server/index.ts',
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
  external: [
    'react',
    'react-dom',
    'swr',
    'drizzle-orm',
    'lucide-react',
    'postgres',
    'bcryptjs',
    'jsonwebtoken',
    'uuid',
    'xlsx',
    '@tarojs/taro', // 小程序环境专用
    'electron', // Electron 环境专用
    'react-native', // React Native 环境专用
    'three', // externalize three to prevent bundling it twice if user app has it
  ],

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
