/**
 * browser / node 条件 exports 配置（R2-212）
 */
export const BROWSER_SERVER_EXPORT_PAIRS = [
  {
    subpath: './common/file',
    browser: 'common/file/index',
    server: 'common/file/server/index',
  },
  {
    subpath: './common/export',
    browser: 'common/export/index',
    server: 'common/export/server/index',
  },
  {
    subpath: './common/auth',
    browser: 'common/auth/index',
    server: 'common/auth/server/index',
  },
  {
    subpath: './common/ossFile',
    browser: 'common/ossFile/index',
    server: 'common/ossFile/server/index',
  },
  {
    subpath: './common/universalFile',
    browser: 'common/universalFile/index',
    server: 'common/universalFile/server/index',
  },
  {
    subpath: './common/universalExport',
    browser: 'common/universalExport/index',
    server: 'common/universalExport/server/index',
  },
  {
    subpath: './common/analytics',
    browser: 'common/analytics/index',
    server: 'common/analytics/server/index',
  },
  {
    subpath: './common/config',
    browser: 'common/config/index',
    server: 'common/config/server/index',
  },
];

export const CLIENT_ONLY_ALIASES = [
  { subpath: './common/file/client', browser: 'common/file/index' },
  { subpath: './common/ossFile/client', browser: 'common/ossFile/index' },
  { subpath: './common/universalExport/client', browser: 'common/universalExport/index' },
];

export const NODE_ONLY_SUBPATHS = [
  './common/file/server',
  './common/export/server',
  './common/auth/server',
  './common/auth/schema',
  './common/auth/services',
  './common/auth/routes',
  './common/auth/middleware',
  './common/ossFile/server',
  './common/universalFile/server',
  './common/universalExport/server',
  './common/analytics/server',
  './common/config/server',
];

export function browserServerPairBySubpath() {
  return new Map(
    BROWSER_SERVER_EXPORT_PAIRS.map((pair) => [pair.subpath, pair]),
  );
}

export function browserServerEntryKeys() {
  const keys = new Set();
  for (const pair of BROWSER_SERVER_EXPORT_PAIRS) {
    keys.add(pair.browser);
    keys.add(pair.server);
  }
  return keys;
}

export function nodeOnlySubpathSet() {
  return new Set(NODE_ONLY_SUBPATHS);
}
