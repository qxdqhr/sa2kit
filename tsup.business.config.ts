import { defineConfig } from 'tsup';
import { businessEntries } from './tsup.entries.business';
import { tsupSharedOptions } from './tsup.shared';

export default defineConfig({
  ...tsupSharedOptions,
  entry: businessEntries,
  /** 追加写入 dist，不覆盖 common 产物 */
  clean: false,
});
