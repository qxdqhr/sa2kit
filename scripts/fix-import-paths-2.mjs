#!/usr/bin/env node
/**
 * 修正 fix-import-paths 误替换的 ./common/* 相对路径
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const src = join(root, 'src');
const EXTS = new Set(['.ts', '.tsx', '.mts']);

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

function commonRelative(fromDir, target) {
  const from = relative(src, fromDir).split('/');
  const depth = from.length;
  if (from[0] === 'common') {
    const up = '../'.repeat(depth - 1);
    return `${up}${target}`;
  }
  if (from[0] === 'business') {
    const up = '../'.repeat(depth);
    return `${up}common/${target}`;
  }
  return `./common/${target}`;
}

const TARGETS = ['utils', 'components', 'logger', 'storage', 'request'];

let changed = 0;
for (const file of walk(src)) {
  const dir = join(file, '..');
  let text = readFileSync(file, 'utf8');
  let next = text;

  for (const target of TARGETS) {
    const wrong = `./common/${target}`;
    if (!next.includes(wrong)) continue;
    const correct = commonRelative(dir, target);
    next = next.split(wrong).join(correct);
  }

  // universalFile/server/* : ../logger → ../../logger
  if (file.includes('/common/universalFile/server/') || file.includes('/common/universalExport/server/')) {
    next = next.replace(/from '\.\.\/logger'/g, "from '../../logger'");
  }

  if (next !== text) {
    writeFileSync(file, next, 'utf8');
    changed += 1;
  }
}

console.log(`✓ fixed ${changed} files`);
