import { defineConfig } from 'tsup';
import { businessEntries } from './tsup.entries.business';
import { commonEntries } from './tsup.entries.common';
import { tsupSharedOptions } from './tsup.shared';

/**
 * 开发 watch 用合并配置；生产构建请用 build:common + build:business（R2-301）。
 */
export default defineConfig({
  ...tsupSharedOptions,
  entry: {
    ...commonEntries,
    ...businessEntries,
  },
  clean: true,
});
