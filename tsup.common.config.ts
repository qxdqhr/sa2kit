import { defineConfig } from 'tsup';
import { commonEntries } from './tsup.entries.common';
import { tsupSharedOptions } from './tsup.shared';

export default defineConfig({
  ...tsupSharedOptions,
  entry: commonEntries,
  /** R2-302：common 层共享 chunk（仅 ESM 生效） */
  splitting: true,
  clean: true,
});
