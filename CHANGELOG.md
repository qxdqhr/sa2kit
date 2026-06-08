# Changelog

## [2.0.0-alpha.2] - 2026-06-08

### Added

- `createFileUrlResolver()` / `FileUrlResolver` 类型（ossFile/server，R2-203）
- `tests/ossFile/fileUrlResolver.test.ts`

### Changed

- showmasterpiece DB 初始化不再写入 `globalThis.__sa2kitShowmasterpieceResolveFileUrl`
- `.gitignore` 允许追踪 `docs/REFACTOR_2.0_BACKLOG.md`

## [2.0.0-alpha.1] - 2026-06-08

### Added

- **common 层入口**：`sa2kit/common`、`sa2kit/common/logger|utils|storage|request|file|export` 及对应 `/server` 子路径
- **business 层入口**：`sa2kit/business` barrel
- 脚本：`scripts/smoke-exports.mjs`、`scripts/snapshot-exports.mjs`（`pnpm smoke:exports` / `pnpm snapshot:exports`）
- `docs/exports-1.x-snapshot.json` exports 归档
- ESLint：`common` 禁止 import `business`（R2-106）

### Changed

- `src/common/*` 重组：file/export 委托 ossFile / universalExport
- showmasterpiece `fileService` 改为 re-export `common/file`
- 删除 `src/services/universalFile/` 桩实现（R2-202）

## [2.0.0-alpha.0] - 2026-06-08

### Added

- 2.0 重构 Backlog SSOT：`docs/REFACTOR_2.0_BACKLOG.md`（common / business 分层、57 项可执行任务）
- `sa2kit/ossFile` 模块（基于 universalFile 的统一文件上传/下载入口，重构进行中）

### Changed

- 版本线从 1.6.x 切换到 **2.0.0-alpha.0**（重构阶段，不保证 API 稳定）
- README 增加 2.0 架构说明与 Backlog 链接

### Deprecated

- 1.x 新功能冻结；仅 critical fix
- 业务模块（showmasterpiece 等）计划迁出 sa2kit，见 Backlog Phase 4

### Notes

- 生产环境若依赖 1.6.x，请 pin `sa2kit@1.6.118` 直至 2.0 stable
- 详细任务进度见 [REFACTOR_2.0_BACKLOG.md](./docs/REFACTOR_2.0_BACKLOG.md)

## [1.6.118] - (legacy)

1.x 末版维护线。文件能力见 `universalFile` / 新增 `ossFile`。
