#!/usr/bin/env node
/**
 * 由 tsup entry 清单生成 package.json exports（R2-307 / R2-212）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BROWSER_SERVER_EXPORT_PAIRS,
  CLIENT_ONLY_ALIASES,
  NODE_ONLY_SUBPATHS,
} from './exports-conditions.mjs';

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

export function buildBrowserNodeConditionalExport(browserEntryKey, serverEntryKey) {
  const browserBase = entryKeyToDistBase(browserEntryKey);
  const serverBase = entryKeyToDistBase(serverEntryKey);
  return {
    types: `./${browserBase}.d.ts`,
    browser: {
      import: `./${browserBase}.mjs`,
      require: `./${browserBase}.js`,
    },
    node: {
      import: `./${serverBase}.mjs`,
      require: `./${serverBase}.js`,
    },
    default: {
      import: `./${browserBase}.mjs`,
      require: `./${browserBase}.js`,
    },
  };
}

export function buildNodeOnlyExport(entryKey) {
  const distBase = entryKeyToDistBase(entryKey);
  return {
    types: `./${distBase}.d.ts`,
    node: {
      import: `./${distBase}.mjs`,
      require: `./${distBase}.js`,
    },
    default: {
      import: `./${distBase}.mjs`,
      require: `./${distBase}.js`,
    },
  };
}

const pairByBrowserKey = new Map(
  BROWSER_SERVER_EXPORT_PAIRS.map((pair) => [pair.browser, pair]),
);
const pairByServerKey = new Map(
  BROWSER_SERVER_EXPORT_PAIRS.map((pair) => [pair.server, pair]),
);
const nodeOnlySubpaths = new Set(NODE_ONLY_SUBPATHS);

export function generateExportsFromEntryKeys(entryKeys) {
  const exportsMap = {};
  const handled = new Set();

  for (const pair of BROWSER_SERVER_EXPORT_PAIRS) {
    if (!entryKeys.includes(pair.browser) || !entryKeys.includes(pair.server)) {
      continue;
    }
    exportsMap[pair.subpath] = buildBrowserNodeConditionalExport(
      pair.browser,
      pair.server,
    );
    handled.add(pair.browser);
    handled.add(pair.server);
  }

  for (const key of [...entryKeys].sort()) {
    if (handled.has(key)) {
      const subpath = entryKeyToSubpath(key);
      if (nodeOnlySubpaths.has(subpath)) {
        exportsMap[subpath] = buildNodeOnlyExport(key);
      }
      continue;
    }

    const subpath = entryKeyToSubpath(key);
    exportsMap[subpath] = buildExportEntry(key);
  }

  for (const alias of CLIENT_ONLY_ALIASES) {
    if (entryKeys.includes(alias.browser) && !(alias.subpath in exportsMap)) {
      exportsMap[alias.subpath] = buildExportEntry(alias.browser);
    }
  }

  // UI 门面：源码再导出（与 widgets/admin 一致，宿主 transpilePackages 可解析）。
  // dist 仍由 write-ui-facade.mjs 生成，供不读 exports 的深路径/兼容消费。
  exportsMap['./common/ui'] = {
    types: './src/common/ui/index.ts',
    import: './src/common/ui/index.ts',
    require: './src/common/ui/index.ts',
    default: './src/common/ui/index.ts',
  };
  exportsMap['./common/ui/style'] = './src/common/ui/style.css';
  // 管理台兼容层（源码入口，由宿主 transpile）
  exportsMap['./common/ui/admin'] = {
    types: './src/common/ui/admin/index.ts',
    import: './src/common/ui/admin/index.ts',
    require: './src/common/ui/admin/index.ts',
    default: './src/common/ui/admin/index.ts',
  };
  // types 走 dist（消费方解析 @sa2kit-ui/rn）；运行时源码供 Metro transpile
  exportsMap['./common/ui/rn'] = {
    types: './dist/common/ui/rn/index.d.ts',
    import: './src/common/ui/rn/index.ts',
    require: './src/common/ui/rn/index.ts',
    default: './src/common/ui/rn/index.ts',
  };
  exportsMap['./common/ui/patterns'] = {
    types: './src/common/ui/patterns/index.ts',
    import: './src/common/ui/patterns/index.ts',
    require: './src/common/ui/patterns/index.ts',
    default: './src/common/ui/patterns/index.ts',
  };
  exportsMap['./common/ui/patterns/next'] = {
    types: './src/common/ui/patterns/next.tsx',
    import: './src/common/ui/patterns/next.tsx',
    require: './src/common/ui/patterns/next.tsx',
    default: './src/common/ui/patterns/next.tsx',
  };
  exportsMap['./common/ui/widgets'] = {
    types: './src/common/ui/widgets/index.ts',
    import: './src/common/ui/widgets/index.ts',
    require: './src/common/ui/widgets/index.ts',
    default: './src/common/ui/widgets/index.ts',
  };
  exportsMap['./common/ui/auth'] = {
    types: './src/common/ui/auth/index.ts',
    import: './src/common/ui/auth/index.ts',
    require: './src/common/ui/auth/index.ts',
    default: './src/common/ui/auth/index.ts',
  };

  return exportsMap;
}

function exportEntriesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export { exportEntriesEqual };

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
    pkg.main = mainExport.require ?? mainExport.default?.require;
    pkg.module = mainExport.import ?? mainExport.default?.import;
    pkg.types = mainExport.types;
  }

  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  const conditionalCount = BROWSER_SERVER_EXPORT_PAIRS.filter(
    (pair) => pair.subpath in generated && generated[pair.subpath].browser,
  ).length;

  console.log(
    `✓ synced ${Object.keys(generated).length} exports (${commonKeys.length} common + ${businessKeys.length} business entries, ${conditionalCount} browser/node pairs)`,
  );
}

if (process.argv[1]?.endsWith('generate-exports.mjs')) {
  main();
}
