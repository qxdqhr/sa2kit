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
    'calendar/index': 'src/calendar/index.ts',
    'calendar/server': 'src/calendar/server.ts',
    'calendar/routes/index': 'src/calendar/routes/index.ts',
    'imageCrop/index': 'src/imageCrop/index.ts',
    'testYourself/index': 'src/testYourself/index.ts',
    'testYourself/admin/index': 'src/testYourself/admin/index.ts',
    'testYourself/server/index': 'src/testYourself/server/index.ts',
    'music/index': 'src/music/index.ts',
    'music/server/index': 'src/music/server/index.ts',
    'mikuFusionGame/index': 'src/mikuFusionGame/index.ts',
    'mikuFireworks3D/index': 'src/mikuFireworks3D/index.ts',
    'mikuFireworks3D/server/index': 'src/mikuFireworks3D/server/index.ts',
    'components/index': 'src/components/index.ts',
    'navigation/index': 'src/navigation/index.ts',
    'portfolio/index': 'src/portfolio/index.ts',
    'showmasterpiece/index': 'src/showmasterpiece/index.ts',
    'showmasterpiece/server/index': 'src/showmasterpiece/server/index.ts',
    'showmasterpiece/scripts/index': 'src/showmasterpiece/scripts/index.ts',
    'showmasterpiece/migration/index': 'src/showmasterpiece/migration/index.ts',
    'iflytek/index': 'src/iflytek/index.ts',
    'iflytek/server': 'src/iflytek/server.ts',
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
    'next',
    '@xenova/transformers',
    '@imgly/background-removal',
    'tesseract.js',
    'onnxruntime-node',
    'onnxruntime-web',
    'ws',
    'crypto'
  ],

  // Skip node_modules
  skipNodeModulesBundle: true,

  // Tree-shaking
  treeshake: true,

  // Output directory
  outDir: 'dist',

  // Platform target
  platform: 'neutral', // Works in both browser and Node.js
});
