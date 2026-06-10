import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Options } from 'tsup';

const root = join(fileURLToPath(import.meta.url), '..');

/** 2.0 common + business 构建共享选项（R2-301） */
export const tsupSharedOptions: Omit<Options, 'entry' | 'clean'> = {
  format: ['esm', 'cjs'],
  dts: true,
  /** business 保持 entry 隔离；splitting 仅 common 启用（R2-302） */
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'es2020',
  external: [
    'react',
    'react-dom',
    'swr',
    'drizzle-orm',
    'better-auth',
    '@better-auth/drizzle-adapter',
    'lucide-react',
    'postgres',
    'bcryptjs',
    'jsonwebtoken',
    'uuid',
    'xlsx',
    '@tarojs/taro',
    '@tarojs/components',
    'electron',
    'react-native',
    'three',
    'next',
    '@xenova/transformers',
    '@imgly/background-removal',
    'tesseract.js',
    'onnxruntime-node',
    'onnxruntime-web',
    'ws',
    'crypto',
  ],
  skipNodeModulesBundle: true,
  treeshake: true,
  outDir: 'dist',
  platform: 'neutral',
  esbuildOptions(options) {
    options.alias = {
      ...(options.alias ?? {}),
      '@/components': join(root, 'src/common/components'),
      '@/utils': join(root, 'src/common/utils'),
    };
  },
};
