#!/usr/bin/env node
/**
 * prepare 钩子（R2-305）
 * - 从 npm 安装：跳过（tarball 已含 prepublishOnly 完整 dist）
 * - 本地 clone：默认 build:common；SA2KIT_WITH_BUSINESS=1 时全量 build
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

if (!existsSync(join(root, 'src'))) {
  console.log('[prepare] skip — published package (prebuilt dist in tarball)');
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
