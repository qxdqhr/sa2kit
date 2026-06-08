#!/usr/bin/env node
/**
 * CI：common 构建内存与 dist 体积门禁（R2-306）
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_COMMON_DIST_MB = 10;
const HEAP_MB = 4096;

function dirSizeBytes(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      total += dirSizeBytes(full);
    } else {
      total += stat.size;
    }
  }
  return total;
}

function commonDistBytes() {
  const distRoot = join(root, 'dist');
  if (!existsSync(distRoot)) {
    throw new Error('dist/ not found — run build:common first');
  }

  let total = 0;
  const commonDir = join(distRoot, 'common');
  if (existsSync(commonDir)) {
    total += dirSizeBytes(commonDir);
  }

  const legacyCommonRoots = [
    'logger',
    'utils',
    'storage',
    'request',
    'api',
    'universalFile',
    'ossFile',
    'universalExport',
    'i18n',
    'analytics',
    'auth',
    'config',
    'imageCrop',
    'ai',
  ];

  for (const name of legacyCommonRoots) {
    const path = join(distRoot, name);
    if (existsSync(path)) {
      total += dirSizeBytes(path);
    }
  }

  return total;
}

console.log(`[ci:common-build] build:common with ${HEAP_MB}MB heap…`);
execSync('pnpm run build:common', {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: `--max-old-space-size=${HEAP_MB}`,
  },
});

const bytes = commonDistBytes();
const mb = bytes / (1024 * 1024);
console.log(`[ci:common-build] common dist ≈ ${mb.toFixed(2)} MB`);

if (mb > MAX_COMMON_DIST_MB) {
  console.error(`✗ common dist ${mb.toFixed(2)} MB exceeds ${MAX_COMMON_DIST_MB} MB target`);
  process.exit(1);
}

console.log(`✓ common build passed (${HEAP_MB / 1024}GB heap, dist ≤ ${MAX_COMMON_DIST_MB}MB)`);
