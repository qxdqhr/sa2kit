import { defineConfig } from 'tsup';
import { commonEntries } from './tsup.entries.common';
import { tsupSharedOptions } from './tsup.shared';

export default defineConfig({
  ...tsupSharedOptions,
  entry: commonEntries,
  clean: true,
});
