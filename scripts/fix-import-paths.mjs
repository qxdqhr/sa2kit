#!/usr/bin/env node
/**
 * 目录重组后批量修正 import 路径（common / business 分层）
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = join(import.meta.dirname, '..');
const src = join(root, 'src');

const EXTS = new Set(['.ts', '.tsx', '.mts']);

/** 按路径深度从长到短，避免部分替换 */
const REPLACEMENTS = [
  // common 层内部：file/export 薄入口
  ["from '../../ossFile", "from '../ossFile"],
  ["from '../../../ossFile", "from '../../ossFile"],
  ["from '../../universalFile", "from '../universalFile"],
  ["from '../../../universalFile", "from '../../universalFile"],
  ["from '../../universalExport", "from '../universalExport"],
  ["from '../../../universalExport", "from '../../universalExport"],
  // logger 引用（universalFile 等迁入 common 后）
  ["from '../../../logger'", "from '../../logger'"],
  ["from '../../logger'", "from '../logger'"],
  ["from '../logger'", "from '../logger'"],
  // request/storage 在 common 内
  ["from '../../../request/", "from '../../request/"],
  ["from '../../../storage/", "from '../../storage/"],
  ["from '../../../../request/", "from '../../../request/"],
  ["from '../../../../storage/", "from '../../../storage/"],
  // ai/llm utils
  ["from '../../../../../utils/cn'", "from '../../../utils/cn'"],
  ["from '../../../../utils/cn'", "from '../../../utils/cn'"],
  // analytics adapter
  ["from '../../storage/", "from '../storage/"],
  // ossFile httpClient
  ["from '../../request/", "from '../request/"],
  // api module
  ["from '../storage'", "from '../storage'"],
  ["from '../request'", "from '../request'"],
  // business → common storage hooks
  ["from '../../storage/", "from '../../../common/storage/"],
  ["from '../../../common/storage/", "from '../../../common/storage/"],
  // components → utils (同处 common)
  ['from "../utils"', 'from "../utils"'],
  ["from '../utils'", "from '../utils'"],
  ["from '@/utils'", "from '@/common/utils'"],
  // index.ts root paths
  ["from './logger'", "from './common/logger'"],
  ["from './utils'", "from './common/utils'"],
  ["from './components'", "from './common/components'"],
  ["from './storage/types'", "from './common/storage/types'"],
  ["from './storage/hooks'", "from './common/storage/hooks'"],
  ["from './ai/", "from './common/ai/"],
  ["from './profile'", "from './business/profile'"],
  ["from './portfolio'", "from './business/portfolio'"],
  ["from './navigation'", "from './business/navigation'"],
  ["from './testField'", "from './business/testField'"],
  ["from './mikuFireworks3D'", "from './business/mikuFireworks3D'"],
  ["from './screenReceiver'", "from './business/screenReceiver'"],
  ["from './festivalCard'", "from './business/festivalCard'"],
  ["from './vocaloidBooth'", "from './business/vocaloidBooth'"],
  ["from './mikuContest'", "from './business/mikuContest'"],
  // common/index sibling exports
  ["from '../i18n'", "from './i18n'"],
  ["from '../analytics'", "from './analytics'"],
  ["from '../config'", "from './config'"],
  ["from '../api'", "from './api'"],
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
for (const file of walk(src)) {
  let text = readFileSync(file, 'utf8');
  let next = text;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  if (next !== text) {
    writeFileSync(file, next, 'utf8');
    changed += 1;
  }
}

console.log(`✓ updated ${changed} files`);
