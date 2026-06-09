#!/usr/bin/env node
/**
 * CI：校验 package.json exports 与 tsup entry 一致（R2-307）
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  exportEntriesEqual,
  generateExportsFromEntryKeys,
} from './generate-exports.mjs';

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

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const commonKeys = parseEntryKeys('tsup.entries.common.ts');
const businessKeys = parseEntryKeys('tsup.entries.business.ts');
const expected = generateExportsFromEntryKeys([...commonKeys, ...businessKeys]);
const actual = pkg.exports ?? {};

const missing = Object.keys(expected).filter((key) => !actual[key]);
const extra = Object.keys(actual).filter((key) => !expected[key]);
const mismatched = Object.keys(expected).filter(
  (key) => actual[key] && !exportEntriesEqual(expected[key], actual[key]),
);

if (missing.length || extra.length || mismatched.length) {
  if (missing.length) console.error('✗ missing exports:', missing.join(', '));
  if (extra.length) console.error('✗ extra exports:', extra.join(', '));
  if (mismatched.length) console.error('✗ mismatched exports:', mismatched.join(', '));
  console.error('\nRun: pnpm exports:sync');
  process.exit(1);
}

console.log(`✓ ${Object.keys(actual).length} exports match tsup entry manifest`);
