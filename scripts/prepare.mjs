#!/usr/bin/env node
/**
 * prepare 钩子（R2-305）
 * - 从 npm 安装（无 src/）：跳过，使用 tarball 预构建 dist
 * - dist 已含 business 产物（如 prepublishOnly 全量构建后）：跳过，避免 build:common 覆盖
 * - 宿主 monorepo（workspace `@sa2kit-ui/react` 尚无 types）：跳过，交给 postinstall / build:libs
 * - 本地 clone：默认 build:common；SA2KIT_WITH_BUSINESS=1 时全量 build
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
/** 3.2+ business 产物位于 dist/business/*（旧版为 dist/mmd 等扁平路径） */
const businessMarker = join(root, 'dist', 'business', 'mmd', 'index.js');

if (
  process.env.SA2KIT_SKIP_PREPARE === '1' ||
  process.env.SA2KIT_SKIP_PREPARE === 'true'
) {
  console.log('[prepare] skip — SA2KIT_SKIP_PREPARE=1（由宿主 monorepo 统一 build:libs）');
  process.exit(0);
}

if (!existsSync(join(root, 'src'))) {
  console.log('[prepare] skip — published package (prebuilt dist in tarball)');
  process.exit(0);
}

if (existsSync(businessMarker)) {
  console.log('[prepare] skip — dist already includes business artifacts');
  process.exit(0);
}

/**
 * workspace 覆盖下 `@sa2kit-ui/react` 的 dist 不进 git；prepare 若先于宿主
 * postinstall（ensure-sa2kit-workspace-dist）跑 build:common，DTS 会因缺 types 失败。
 * npm 预构建包（types 已在 tarball）不受影响。
 */
function sa2kitUiReactTypesReady() {
  const reactRoot = join(root, 'node_modules', '@sa2kit-ui', 'react');
  const pkgJson = join(reactRoot, 'package.json');
  if (!existsSync(pkgJson)) return true;
  try {
    const pkg = JSON.parse(readFileSync(pkgJson, 'utf8'));
    const typesField =
      (typeof pkg.exports?.['.'] === 'object' && pkg.exports['.'].types) ||
      pkg.types ||
      pkg.typings;
    if (!typesField || typeof typesField !== 'string') return true;
    return existsSync(join(reactRoot, typesField));
  } catch {
    return true;
  }
}

if (!sa2kitUiReactTypesReady()) {
  console.log(
    '[prepare] skip — @sa2kit-ui/react types missing (workspace dist not built yet; host postinstall / pnpm build:libs will build UI then sa2kit)',
  );
  process.exit(0);
}

const withBusiness =
  process.env.SA2KIT_WITH_BUSINESS === '1' ||
  process.env.SA2KIT_WITH_BUSINESS === 'true';

const command = withBusiness ? 'pnpm run build' : 'pnpm run build:common';

console.log(
  withBusiness
    ? '[prepare] SA2KIT_WITH_BUSINESS → full build (common + business)'
    : '[prepare] default → build:common only (set SA2KIT_WITH_BUSINESS=1 for full)',
);

execSync(command, { cwd: root, stdio: 'inherit' });
