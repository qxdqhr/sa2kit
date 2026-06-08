# Business exports 变更记录（R2-403）

2.0 alpha 起，已从 npm `exports` **移除**的 business subpath 见：

**[business-exports-trimmed.md](./business-exports-trimmed.md)**

恢复或新增导出：编辑 `tsup.entries.business.ts` → `pnpm exports:sync` → `pnpm build:business`。
