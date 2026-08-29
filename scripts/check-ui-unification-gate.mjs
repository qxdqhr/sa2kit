#!/usr/bin/env node
/**
 * U6 UI 统一门禁（sa2kit）
 * - 禁止 animal-island-ui
 * - common/components 下须为再导出或薄适配
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = join(root, 'src/common/components');

function rg(pattern) {
  const result = spawnSync(
    'rg',
    [
      '-n',
      '--glob',
      '!**/node_modules/**',
      '--glob',
      '!**/dist/**',
      '--glob',
      '!**/docs/**',
      pattern,
      'src',
    ],
    { cwd: root, encoding: 'utf8' },
  );
  if (result.status === 1) return '';
  if (result.status !== 0) {
    throw new Error(result.stderr || `rg failed: ${result.status}`);
  }
  return (result.stdout || '').trim();
}

const failures = [];

const animal = rg("from ['\"]animal-island-ui['\"]|require\\(['\"]animal-island-ui['\"]\\)");
if (animal) {
  failures.push(['禁止 animal-island-ui', animal]);
}

const allowlist = new Set(['index.ts']);
for (const name of readdirSync(componentsDir)) {
  if (allowlist.has(name) || name === 'internal') continue;
  const full = join(componentsDir, name);
  if (!statSync(full).isFile() || !/\.(tsx|ts)$/.test(name)) continue;
  const src = readFileSync(full, 'utf8');
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const isReexport =
    /export\s+\{/.test(src) &&
    (/from\s+['"]\.\.\/ui\//.test(src) || /from\s+['"]@sa2kit-ui\//.test(src)) &&
    !/<[A-Z][A-Za-z]*[\s/>]/.test(stripped);
  const isThinAdapter =
    name === 'BackButton.tsx' &&
    src.includes('../ui/patterns') &&
    src.split('\n').length < 40;
  if (!isReexport && !isThinAdapter) {
    failures.push([
      `common/components/${name} 须为再导出或薄适配（U6.3）`,
      src.slice(0, 240),
    ]);
  }
}

if (failures.length) {
  console.error('✗ sa2kit UI 门禁失败（U6）\n');
  for (const [title, body] of failures) {
    console.error(`## ${title}\n${body}\n`);
  }
  process.exit(1);
}

console.log('✓ sa2kit UI 门禁通过');
