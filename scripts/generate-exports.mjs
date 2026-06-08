#!/usr/bin/env node
/**
 * 由 tsup entry 清单生成 package.json exports（R2-307）
 */
import { readFileSync, writeFileSync } from 'node:fs';
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
    if (line.match(/^\s+index:\s*'/)) {
      keys.push('index');
    }
  }
  return keys;
}

/** tsup entry key → npm subpath */
export function entryKeyToSubpath(entryKey) {
  if (entryKey === 'index') {
    return '.';
  }
  if (entryKey.endsWith('/index')) {
    return `./${entryKey.slice(0, -'/index'.length)}`;
  }
  return `./${entryKey}`;
}

/** tsup entry key → dist 基路径（无扩展名） */
export function entryKeyToDistBase(entryKey) {
  if (entryKey === 'index') {
    return 'dist/index';
  }
  return `dist/${entryKey}`;
}

export function buildExportEntry(entryKey) {
  const distBase = entryKeyToDistBase(entryKey);
  return {
    types: `./${distBase}.d.ts`,
    import: `./${distBase}.mjs`,
    require: `./${distBase}.js`,
  };
}

export function generateExportsFromEntryKeys(entryKeys) {
  const exportsMap = {};
  for (const key of entryKeys.sort()) {
    exportsMap[entryKeyToSubpath(key)] = buildExportEntry(key);
  }
  return exportsMap;
}

function main() {
  const commonKeys = parseEntryKeys('tsup.entries.common.ts');
  const businessKeys = parseEntryKeys('tsup.entries.business.ts');
  const allKeys = [...commonKeys, ...businessKeys];
  const generated = generateExportsFromEntryKeys(allKeys);

  const pkgPath = join(root, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.exports = generated;

  const mainExport = generated['.'];
  if (mainExport) {
    pkg.main = mainExport.require;
    pkg.module = mainExport.import;
    pkg.types = mainExport.types;
  }

  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  const commonCount = commonKeys.length;
  const businessCount = businessKeys.length;
  console.log(
    `✓ synced ${Object.keys(generated).length} exports (${commonCount} common + ${businessCount} business entries)`,
  );
}

if (process.argv[1]?.endsWith('generate-exports.mjs')) {
  main();
}
