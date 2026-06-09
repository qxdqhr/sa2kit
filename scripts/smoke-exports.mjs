#!/usr/bin/env node
/**
 * common 子路径 import 冒烟（R2-004 / R2-212）
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
  './common/file/schema',
  './common/platform',
  './common/auth',
  './common/auth/server',
  './common/export',
  './common/export/server',
];

function resolveImportPath(subpath) {
  const entry = pkg.exports[subpath];
  if (!entry) {
    throw new Error(`Missing exports["${subpath}"]`);
  }

  if (typeof entry.import === 'string') {
    return join(root, entry.import);
  }

  const preferNode = subpath.includes('/server');
  const conditional = preferNode ? entry.node : entry.browser;
  const importPath =
    conditional?.import ??
    entry.default?.import ??
    entry.node?.import ??
    entry.browser?.import;

  if (!importPath) {
    throw new Error(`Missing import target for exports["${subpath}"]`);
  }

  return join(root, importPath);
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
