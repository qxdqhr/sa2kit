#!/usr/bin/env node
/**
 * 报告 sa2kit dist 各 tsup entry 的 .mjs 体积（Phase E 包体可见性）
 */
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseEntryKeys(relativePath) {
  const source = readFileSync(join(root, relativePath), 'utf8');
  const keys = [];
  for (const line of source.split('\n')) {
    const quoted = line.match(/^\s+'([^']+)':\s*'/);
    if (quoted) {
      keys.push(quoted[1]);
      continue;
    }
    if (/^\s+index:\s*'/.test(line)) keys.push('index');
  }
  return keys;
}

function mjsPath(entryKey) {
  if (entryKey === 'index') return join(root, 'dist/index.mjs');
  return join(root, 'dist', `${entryKey.replace(/\/index$/, '')}/index.mjs`);
}

function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

const layers = [
  { name: 'common', file: 'tsup.entries.common.ts' },
  { name: 'business', file: 'tsup.entries.business.ts' },
];

let total = 0;
const rows = [];

for (const layer of layers) {
  for (const key of parseEntryKeys(layer.file)) {
    const path = mjsPath(key);
    try {
      const size = statSync(path).size;
      total += size;
      rows.push({ layer: layer.name, key, size, path });
    } catch {
      rows.push({ layer: layer.name, key, size: -1, path });
    }
  }
}

rows.sort((a, b) => b.size - a.size);

console.log('sa2kit dist entry footprint (.mjs)\n');
console.log('layer\tentry\tsize');
for (const row of rows) {
  const sizeStr = row.size < 0 ? 'MISSING' : formatBytes(row.size);
  console.log(`${row.layer}\t${row.key}\t${sizeStr}`);
}
console.log(`\n合计（已测 entry）: ${formatBytes(total)}`);

const heavy = rows.filter((r) => r.size > 500 * 1024);
if (heavy.length > 0) {
  console.log('\n⚠  >500KB entries（客户仓应避免聚合 import）:');
  for (const row of heavy) {
    console.log(`  - ${row.key}: ${formatBytes(row.size)}`);
  }
}
