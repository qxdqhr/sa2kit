# Changelog

## [2.0.4] - 2026-06-09

### Added

- `./common/file/client`、`./ossFile/client`、`./universalExport/client` — 无 node 条件，供 Next.js SSR 正确解析浏览器 API

## [2.0.3] - 2026-06-09

### Added

- 恢复 profile-v1 依赖的 `./calendar/routes`、`./festivalCard/routes` export

## [2.0.2] - 2026-06-09

### Fixed

- **prepare 钩子**：`npm publish` 时若 `dist` 已含 business 产物则跳过，修复 tarball 仅含 common 导致 consumer 打包失败
- 从 npm 安装时同样跳过 prepare 构建（2.0.1 已部分修复，2.0.2  tarball 含完整 business dist）

## [2.0.1] - 2026-06-09

### Fixed

- **prepare 钩子**：从 npm 安装时跳过构建（无 `src/` 目录）

## [2.0.0] - 2026-06-09

### Removed

- **huarongdao**、**mikuFlick** npm export 与 `src/business/*` 源码（已迁 profile-v1，`R2-406`）
- `mikuFlick` 单元测试（逻辑随模块迁出）

### Changed

- business tsup entries：**87**（48 common + 39 business）
- profile-v1 首个 stable consumer：`^2.0.0`

## [2.0.0-beta.0] - 2026-06-09

### Added

- `docs/MAINTENANCE_1.6.md`；分支 `maintenance/1.6`（自 `v1.6.114`，R2-604）

### Changed

- **common API 冻结**：`sa2kit/common/*` 自本版起按 semver 契约维护（见 `docs/COMMON_API_FREEZE.md`，R2-602）
- README / 迁移指南标注 beta 推荐依赖 `^2.0.0-beta.0`

### Note

- business / auth-legacy 仍可在 beta 内 breaking；2.0.0 stable 前迁出或 deprecated

## [2.0.0-alpha.8] - 2026-06-09

### Added

- `docs/MIGRATION_1.x_to_2.0.md`、`docs/COMMON_API_FREEZE.md`（R2-603 / R2-601）
- `pnpm smoke:file-api` — ossFile bootstrap 集成测试冒烟（R2-506）
- profile-v1 `scripts/smoke-file-api.sh` — universal-file HTTP 路由冒烟
- `analytics/registry` — `registerAnalytics` / `getRegisteredAnalytics`（R2-234）
- `screenReceiver/server/registry` — 进程内 WSS 句柄注册（R2-234）
- `src/common/file/schema/` — Drizzle 文件表结构 SSOT（R2-206）；`sa2kit/common/file/schema` export
- `docs/business-testfield-games-migration.md` — 实验田游戏迁出决策（R2-406）
- `src/business/auth-legacy/` — legacy 认证物理迁入 business（R2-405）
- `src/common/platform/` — `PlatformAdapter` 接口 + web / taro / electron / node-hono 骨架（R2-221 / R2-222）
- `configureOssFileHttp` / `configureOssFileFromPlatform` — ossFile fetch 注入（R2-223）
- `docs/common-platform-adapters.md`（R2-224）
- `tests/common/platformAdapters.test.ts`
- `tests/ossFile/httpClient.test.ts`

### Changed

- `UniversalFileClient` 调试输出改用 `createLogger`（生产默认 INFO，可 `localStorage logger-debug=false` 关闭）（R2-232）
- `registerScreenReceiverForNext` 使用模块 registry，移除 `globalThis.__sa2kit_screen_receiver_wss__`（R2-234）
- 装饰器 `@Track` 等通过 `registerAnalytics` 解析实例，移除 `globalThis.__analytics__`（R2-234）
- README：包名统一为 `sa2kit`、修正「零依赖」表述、补充 optional peer 表（R2-231 / R2-233）
- `business-deprecated-exports.md` 增加 huarongdao / mikuFlick 移除时间表
- **R2-404**：calendar 通过 `CalendarUiProvider` 注入 Modal；portfolio `About` 支持 UI props（`AboutWithDefaults` 向后兼容）
- ESLint 禁止 business 子域整包 `import '@/components'`
- `auth/legacy/*`、`auth/rn`（legacy 部分）tsup entry 迁至 business 构建分区
- `src/auth/legacy/*` 保留 1.x 兼容 re-export shim
- `common/auth/rn` 仅导出新 API client；`RnAccountLoginForm` 迁至 `business/auth-legacy/rn`

## [2.0.0-alpha.7] - 2026-06-08

### Added

- `src/common/auth/` 物理目录（schema / services / routes / hooks / client 等，R2-104）
- `scripts/exports-conditions.mjs` — 8 组 browser/node 条件 exports（R2-212）

### Changed

- auth 内核迁至 `common/auth`；`src/auth/*` 保留 legacy 与 1.x 兼容 re-export
- `./common/file|export|auth|ossFile|…` exports 增加 `browser` / `node` 条件
- smoke-exports 支持条件 exports 解析

## [2.0.0-alpha.6] - 2026-06-08

### Added

- `scripts/generate-exports.mjs` / `exports:sync` / `exports:verify`（R2-307）
- `scripts/prepare.mjs`（默认 `build:common`，`SA2KIT_WITH_BUSINESS=1` 全量）（R2-305）
- `scripts/ci-common-build.mjs`（4GB heap + common dist ≤ 10MB）（R2-306）
- `docs/business-exports-trimmed.md`（R2-303 / R2-403）
- `tests/build/generateExports.test.ts`

### Changed

- common 构建启用 `splitting: true` 共享 chunk（R2-302）
- business tsup entry 收敛至 28 个（profile-v1 按需）
- `package.json` exports 由 entry 清单自动生成（85 条，R2-304）
- CI 增加 exports 校验与 common build 门禁

## [2.0.0-alpha.5] - 2026-06-08

### Changed

- **构建拆分（R2-301）**：`tsup.common.config.ts` + `tsup.business.config.ts`
- 新增 `build:common` / `build:business`；`build` 顺序执行两者
- entry 清单抽离为 `tsup.entries.common.ts` / `tsup.entries.business.ts`
- `scripts/verify-tsup-entries.mjs` 校验分区无重叠

## [2.0.0-alpha.4] - 2026-06-08

### Added

- `resolveUploadFolderPath` / `resolveUploadFolderPathFromFormData`（R2-204）
- `tests/ossFile/path.test.ts`、`tests/ossFile/uploadGetUrl.integration.test.ts`
- browser entry ESLint 规则 + `tests/common/browserEntryImports.test.ts`（R2-213）

### Changed

- `uploadModuleFile` 与 API 路由共用路径解析逻辑

## [2.0.0-alpha.3] - 2026-06-08

### Added

- `createOssFileBootstrap()` / `OssFileBootstrap`（ossFile/server，R2-205）
- `tests/ossFile/bootstrap.test.ts`

### Removed (breaking)

- **showmasterpiece** 全部源码与 npm exports（已迁回 profile-v1，R2-401/R2-402）
- showmasterpiece 相关 tsup entry（13 个）与 ESLint 子域规则

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
