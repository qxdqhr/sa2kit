#!/usr/bin/env node
/**
 * business 构建 dts:false 后写声明：
 * - 白名单（当前 audioDetection）→ re-export src（真实类型）
 * - 其余 → 宽松 any stub（覆盖 import type，避开 next / three 双版本）
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 需要真实类型的入口（纯 domain / 无 next·three 双版本冲突） */
const SRC_SHIM_ENTRIES = new Set([
  'business/audioDetection/index',
  'business/calendar/index',
  'business/calendar/domain/index',
  'business/calendar/ui/rn/index',
  'business/calendar/server/index',
  'business/calendar/routes/index',
  'business/teachHub/index',
  'business/teachHub/domain/index',
  'business/teachHub/ui/rn/index',
  'business/teachHub/server/index',
  'business/teachHub/routes/index',
  'business/showmasterpiece/index',
  'business/showmasterpiece/domain/index',
  'business/showmasterpiece/ui/rn/index',
]);

function parseBusinessEntries() {
  const source = readFileSync(join(root, 'tsup.entries.business.ts'), 'utf8');
  /** @type {Record<string, string>} */
  const entries = {};
  for (const line of source.split('\n')) {
    const quoted = line.match(/^\s+'([^']+)':\s*'([^']+)'/);
    if (quoted) {
      entries[quoted[1]] = quoted[2];
      continue;
    }
    const index = line.match(/^\s+index:\s*'([^']+)'/);
    if (index) entries.index = index[1];
  }
  return entries;
}

function collectNamesFromMjs(entryKey) {
  const mjsPath = join(root, 'dist', `${entryKey}.mjs`);
  try {
    const mjs = readFileSync(mjsPath, 'utf8');
    const names = new Set();
    for (const block of mjs.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
      for (const part of block[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/).pop()?.trim();
        if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
      }
    }
    return [...names];
  } catch {
    return [];
  }
}

function collectTypeNamesFromSrc(srcDir) {
  const names = new Set();
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (name === 'node_modules' || name === 'dist') continue;
      const p = join(dir, name);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(p);
        continue;
      }
      if (!/\.tsx?$/.test(p)) continue;
      const text = readFileSync(p, 'utf8');
      for (const m of text.matchAll(
        /\bexport\s+(?:type\s+|interface\s+|class\s+|enum\s+)([A-Za-z_$][\w$]*)/g,
      )) {
        names.add(m[1]);
      }
      for (const m of text.matchAll(/\bexport\s+type\s*\{([^}]+)\}/g)) {
        for (const part of m[1].split(',')) {
          const n = part.trim().split(/\s+as\s+/).pop()?.trim();
          if (n && /^[A-Za-z_$][\w$]*$/.test(n)) names.add(n);
        }
      }
    }
  };
  walk(srcDir);
  return [...names];
}

function entryKeyToSrcDir(entryKey) {
  if (entryKey === 'index') return join(root, 'src');
  return join(root, 'src', entryKey.replace(/\/index$/, ''));
}

function writeSrcShim(entryKey, srcPath) {
  const distDts = join(root, 'dist', `${entryKey}.d.ts`);
  const absSrc = join(root, srcPath.replace(/\.tsx?$/, ''));
  const rel = relative(dirname(distDts), absSrc).replace(/\\/g, '/');
  const spec = rel.startsWith('.') ? rel : `./${rel}`;
  mkdirSync(dirname(distDts), { recursive: true });
  writeFileSync(
    distDts,
    `/** Auto-generated src shim — see scripts/write-business-dts-shims.mjs */\nexport * from '${spec}';\n`,
  );
}

function writeLooseStub(entryKey) {
  const valueNames = collectNamesFromMjs(entryKey);
  const typeNames = collectTypeNamesFromSrc(entryKeyToSrcDir(entryKey));
  const all = new Set([...valueNames, ...typeNames]);
  const distDts = join(root, 'dist', `${entryKey}.d.ts`);
  mkdirSync(dirname(distDts), { recursive: true });
  if (all.size === 0) {
    writeFileSync(
      distDts,
      `/** Auto-generated loose stub — see scripts/write-business-dts-shims.mjs */\nexport {};\n`,
    );
    return;
  }
  const lines = [`/** Auto-generated loose stub — see scripts/write-business-dts-shims.mjs */`];
  for (const n of [...all].sort()) {
    lines.push(`export declare const ${n}: any;`);
    lines.push(`export type ${n} = any;`);
  }
  writeFileSync(distDts, `${lines.join('\n')}\n`);
}

const entries = parseBusinessEntries();
let srcShims = 0;
let loose = 0;

for (const [entryKey, srcPath] of Object.entries(entries)) {
  if (SRC_SHIM_ENTRIES.has(entryKey)) {
    writeSrcShim(entryKey, srcPath);
    srcShims += 1;
  } else {
    writeLooseStub(entryKey);
    loose += 1;
  }
}

console.log(`[business-dts-shims] src=${srcShims} loose=${loose}`);
