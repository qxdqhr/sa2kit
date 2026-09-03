import { defineConfig } from 'tsup';
import { businessEntries } from './tsup.entries.business';
import { tsupSharedOptions } from './tsup.shared';

export default defineConfig({
  ...tsupSharedOptions,
  entry: businessEntries,
  /** business 含 three/MMD，多版本 @types/three 会让 DTS 失败；宿主只需 JS + common 的 d.ts */
  dts: false,
  /** 追加写入 dist，不覆盖 common 产物 */
  clean: false,
});
