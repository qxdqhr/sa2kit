#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = join(import.meta.dirname, '..');
const src = join(root, 'src');
const EXTS = new Set(['.ts', '.tsx', '.mts']);

const FILE_REPLACEMENTS = [
  ['src/common/platform/adapters/web.ts', [
    ["from '../request/", "from '../../request/"],
    ["from '../storage/", "from '../../storage/"],
  ]],
  ['src/common/platform/adapters/electron.ts', [
    ["from '../request/", "from '../../request/"],
    ["from '../storage/", "from '../../storage/"],
  ]],
  ['src/common/platform/adapters/node-hono.ts', [
    ["from '../request/", "from '../../request/"],
    ["from '../storage/", "from '../../storage/"],
  ]],
  ['src/common/auth/rn/token-storage.ts', [
    ["from '../storage/", "from '../../storage/"],
  ]],
  ['src/common/analytics/adapters/web.ts', [
    ["from '../storage/", "from '../../storage/"],
  ]],
  ['src/common/file/server/index.ts', [
    ["from '../ossFile/", "from '../../ossFile/"],
  ]],
  ['src/common/export/server/index.ts', [
    ["from '../universalExport/", "from '../../universalExport/"],
  ]],
  ['src/common/components/PermissionGuard.tsx', [
    ["from '../common/auth/", "from '../auth/"],
  ]],
  ['src/common/ossFile/server/index.ts', [
    ["from '../../common/file/schema'", "from '../../file/schema'"],
  ]],
  ['src/common/universalFile/server/drizzle-schemas/index.ts', [
    ["from '../../../common/file/schema'", "from '../../../file/schema'"],
  ]],
  ['src/common/universalFile/server/db/services/fileDbService.ts', [
    ["from '../../../../common/file/schema'", "from '../../../file/schema'"],
  ]],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(p, files);
    } else if (EXTS.has(extname(name))) {
      files.push(p);
    }
  }
  return files;
}

let changed = 0;

for (const [rel, reps] of FILE_REPLACEMENTS) {
  const file = join(root, rel);
  let text = readFileSync(file, 'utf8');
  let next = text;
  for (const [from, to] of reps) next = next.split(from).join(to);
  if (next !== text) {
    writeFileSync(file, next, 'utf8');
    changed += 1;
  }
}

// universalFile/server/{providers,processors,cache,persistence} → ../../../logger
for (const file of walk(join(src, 'common/universalFile/server'))) {
  const rel = file.replace(`${src}/`, '');
  if (!rel.match(/server\/(providers|processors|cache|persistence)\//)) continue;
  let text = readFileSync(file, 'utf8');
  const next = text.replace(/from '\.\.\/\.\.\/logger'/g, "from '../../../logger'");
  if (next !== text) {
    writeFileSync(file, next, 'utf8');
    changed += 1;
  }
}

console.log(`✓ fixed ${changed} files`);
