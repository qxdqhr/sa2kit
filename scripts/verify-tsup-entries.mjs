#!/usr/bin/env node
/**
 * 校验 common + business entry 无重叠且与单体清单数量一致（R2-301）
 */
import { readFileSync } from 'node:fs';
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
    const bare = line.match(/^\s+index:\s*'/);
    if (bare) {
      keys.push('index');
    }
  }
  return keys;
}

const commonKeys = parseEntryKeys('tsup.entries.common.ts');
const businessKeys = parseEntryKeys('tsup.entries.business.ts');

const overlap = commonKeys.filter((key) => businessKeys.includes(key));
if (overlap.length > 0) {
  console.error('✗ common/business entry overlap:', overlap.join(', '));
  process.exit(1);
}

const mergedCount = commonKeys.length + businessKeys.length;
const expectedTotal = 65;

console.log(
  `✓ ${commonKeys.length} common + ${businessKeys.length} business entries (${mergedCount} total)`,
);

if (mergedCount !== expectedTotal) {
  console.error(`✗ expected ${expectedTotal} entries, got ${mergedCount}`);
  process.exit(1);
}

console.log('✓ entry partition verified');
