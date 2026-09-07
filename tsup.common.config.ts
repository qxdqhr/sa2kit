import { defineConfig } from 'tsup';
import { commonEntries } from './tsup.entries.common';
import { tsupSharedOptions } from './tsup.shared';

export default defineConfig({
  ...tsupSharedOptions,
  entry: commonEntries,
  /** R2-302：common 层共享 chunk（仅 ESM 生效） */
  splitting: true,
  /** 勿 clean 整个 dist：会删掉 business 产物（portfolio 等）；由 build:common 只清 dist/common */
  clean: false,
});
