#!/usr/bin/env node
/**
 * 归档 package.json exports 清单（R2-005）
 * 用法：node scripts/snapshot-exports.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const exportsMap = pkg.exports ?? {};
const keys = Object.keys(exportsMap).sort();

const snapshot = {
  generatedAt: new Date().toISOString(),
  packageVersion: pkg.version,
  total: keys.length,
  common: keys.filter((k) => k.startsWith('./common')),
  business: keys.filter((k) => k.startsWith('./business')),
  legacy: keys.filter((k) => !k.startsWith('./common') && !k.startsWith('./business')),
  all: keys,
};

const outPath = join(root, 'docs/exports-1.x-snapshot.json');
writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(`Wrote ${keys.length} export keys → ${outPath}`);
