#!/usr/bin/env node
/**
 * common 子路径 import 冒烟（R2-004）
 * 需先 pnpm build
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** 2.0 common 必测 subpath（business 暂 skip） */
const COMMON_SUBPATHS = [
  './common',
  './common/logger',
  './common/utils',
  './common/storage',
  './common/request',
  './common/file',
  './common/file/server',
  './common/export',
  './common/export/server',
];

function resolveImportPath(subpath) {
  const entry = pkg.exports[subpath];
  if (!entry?.import) {
    throw new Error(`Missing exports["${subpath}"].import`);
  }
  return join(root, entry.import);
}

let failed = 0;

for (const subpath of COMMON_SUBPATHS) {
  const filePath = resolveImportPath(subpath);
  if (!existsSync(filePath)) {
    console.error(`✗ ${subpath} — file missing: ${filePath}`);
    failed += 1;
    continue;
  }

  const isServerEntry = subpath.includes('/server');
  if (isServerEntry) {
    // server bundle 可能依赖 next/postgres 等，冒烟仅校验产物存在
    console.log(`✓ ${subpath} (artifact exists, skip runtime import)`);
    continue;
  }

  try {
    await import(pathToFileURL(filePath).href);
    console.log(`✓ ${subpath}`);
  } catch (error) {
    console.error(`✗ ${subpath} —`, error instanceof Error ? error.message : error);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} common export(s) failed smoke import`);
  process.exit(1);
}

console.log('\nAll common exports passed smoke import');
