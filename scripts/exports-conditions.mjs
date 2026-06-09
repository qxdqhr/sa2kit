/**
 * browser / node 条件 exports 配置（R2-212）
 *
 * 每项：npm subpath + 对应 tsup entry key（browser 与 server）
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
    subpath: './ossFile',
    browser: 'ossFile/index',
    server: 'ossFile/server/index',
  },
  {
    subpath: './universalFile',
    browser: 'universalFile/index',
    server: 'universalFile/server/index',
  },
  {
    subpath: './universalExport',
    browser: 'universalExport/index',
    server: 'universalExport/server/index',
  },
  {
    subpath: './analytics',
    browser: 'analytics/index',
    server: 'analytics/server/index',
  },
  {
    subpath: './config',
    browser: 'config/index',
    server: 'config/server/index',
  },
];

/**
 * 无 node 条件的 client 别名（Next.js SSR 打包时避免误解析 server 入口）
 */
export const CLIENT_ONLY_ALIASES = [
  { subpath: './common/file/client', browser: 'common/file/index' },
  { subpath: './ossFile/client', browser: 'ossFile/index' },
  { subpath: './universalExport/client', browser: 'universalExport/index' },
];

/** 显式 server subpath（node 优先，保留 1.x 深路径） */
export const NODE_ONLY_SUBPATHS = [
  './common/file/server',
  './common/export/server',
  './common/auth/server',
  './ossFile/server',
  './universalFile/server',
  './universalExport/server',
  './analytics/server',
  './config/server',
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
