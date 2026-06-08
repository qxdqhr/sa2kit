#!/usr/bin/env node
/**
 * prepare 钩子：默认仅 build:common（R2-305）
 * 完整构建：SA2KIT_WITH_BUSINESS=1 pnpm install
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
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
