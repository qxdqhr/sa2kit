# Calendar 模块迁移报告（profile-v1 -> sa2kit）

更新时间：2026-02-27  
适用范围：将 `profile-v1/src/modules/calendar` 完整迁移为 `sa2kit` 内可复用、前后端分层清晰的日历模块  
参考架构：`src/showmasterpiece`（按 UI / logic / server / db / types 分层）

---

## 1. 结论先行

当前 `sa2kit/src/calendar` 已经基本承接了 `profile-v1/src/modules/calendar` 的代码主体（目录与能力大体齐全），但还不是“可直接稳定复用”的最终形态。

迁移状态判定：

- 功能覆盖：`~85%`（UI、API、DB、service 已在位）
- 架构完整度：`~75%`（已有 server/db/service/hooks，但尚未按 showmasterpiece 风格彻底分层）
- 可执行性：`可执行迁移`，但需先解决 P0 阻塞项（见第 4 节）

建议：按本报告的 4 阶段计划推进，先打通“可运行”，再做“可维护”和“可扩展”。

---

## 2. 现状对比（profile vs sa2kit）

## 2.1 目录与分层对比

### profile-v1（来源）

- 路径：`src/modules/calendar`
- 路由挂载：`src/app/api/calendar/*`（转发到模块 API）
- 数据库依赖：模块内部直接依赖项目 `db`

### sa2kit（目标）

- 路径：`src/calendar`
- 新增能力：`src/calendar/routes/index.ts`（支持 handler 工厂，适配外部注入）
- 解耦方向：`calendarDbService` 改为 `setDb()` 注入，符合 SDK 化方向

## 2.2 文件对比结果（快速统计）

- profile 日历文件数：31
- sa2kit 日历文件数：33
- sa2kit 独有文件：
  - `src/calendar/components/internal/PopWindow.tsx`
  - `src/calendar/routes/index.ts`
- 共同文件：31（其中 29 个内容不完全一致，主要是导入路径、样式写法、字符串拼接等改造）

## 2.3 分层能力覆盖

- UI 层：有（`components`、`pages`）
- Hook/状态层：有（`hooks`）
- Service 层：有（`services`）
- API 层：有（`api`）
- DB 层：有（`db/schema.ts` + `db/calendarDbService.ts`）
- SDK 入口：有（`index.ts`、`server.ts`、`routes/index.ts`）

结论：模块形态齐全，但“端到端可运行”还受 P0 项影响。

---

## 3. 与 showmasterpiece 架构对齐分析

showmasterpiece 的核心优点是“按职责分离且跨端可扩展”：

- `ui/web`、`ui/miniapp`：界面层独立
- `logic`：业务逻辑与状态
- `server`：服务端边界
- `db`：数据定义与持久化
- `types`：统一类型协议

calendar 目前虽然具备这些角色，但目录仍偏“平铺”，建议迁移到如下目标结构。

目标结构（建议）：

```text
src/calendar/
  ui/
    web/
      components/
      pages/
  logic/
    hooks/
    services/
    shared/
  server/
    routes/
    services/
    auth/
  db/
    schema.ts
    calendarDbService.ts
  types/
  utils/
  index.ts
  server.ts
```

说明：

- 现有 `components/pages/hooks/services` 可先保持实现不动，先做目录重组和导出兼容层。
- `routes/index.ts` 继续保留为 SDK 对外路由工厂入口。

---

## 4. P0 阻塞项（必须先解决）

## 4.1 身份类型不一致（已触发 TS 报错）

现象：calendar API 路由里 `user.id` 被当作 `number`，但 `src/auth/server.ts` 的 `validateApiAuth` 返回 `id` 可能是 `string`，导致类型错误和潜在运行时问题。

影响文件：

- `src/calendar/api/config/route.ts`
- `src/calendar/api/events/route.ts`

处理建议（二选一，推荐 A）：

- A. calendar API 统一改用 `validateApiAuthNumeric`。
- B. calendar 路由内部强制 `Number(user.id)` 并做 NaN 守卫。

## 4.2 DB 注入链路未闭环

现象：`calendarDbService` 已改成 `setDb()` 注入模式，但 `src/calendar/api/*` 路由仍直接调用 `calendarDbService`，如果宿主未提前注入 DB，会在运行时报错。

处理建议：

- 方案 A（推荐）：业务侧使用 `src/calendar/routes/index.ts` 的 handler 工厂，并在工厂层注入 `db`。
- 方案 B：给 `api/*` 增加显式初始化入口（或 fallback 初始化），避免“未 setDb”直接进入请求处理。

## 4.3 路由层双轨并存，易混用

现状：

- 一套是 `src/calendar/api/*`（传统路由实现）
- 一套是 `src/calendar/routes/index.ts`（工厂模式）

建议：

- 对外保留工厂模式作为标准入口。
- `api/*` 标记为“示例/兼容层”，文档明确不建议新项目直接依赖。

---

## 5. 可执行迁移方案（4 阶段）

## 阶段 1：可运行修复（P0）

目标：先确保模块在宿主项目中可稳定跑通。

任务：

1. 统一 calendar API 的用户 ID 为数字（切换 `validateApiAuthNumeric` 或做强制转换）。
2. 固化 DB 初始化路径（推荐全部走 `routes` 工厂并传 `db`）。
3. 增加最小 E2E 冒烟：`GET/POST /calendar/events`、`GET/PUT /calendar/config`。

交付：

- 可运行 demo 路由
- 冒烟通过记录

验收标准：

- 不再出现 userId string/number 类型冲突
- 不再出现 `Database instance not set` 报错

## 阶段 2：分层重构（对齐 showmasterpiece）

目标：形成清晰的 UI/logic/server/db 分层，便于维护。

任务：

1. `components/pages` 重组到 `ui/web/*`。
2. `hooks/services` 重组到 `logic/*`（其中纯服务可分 `logic/services`，可复用函数放 `logic/shared`）。
3. `api/*` 迁移到 `server/routes/*`，保留兼容导出。
4. 更新 `index.ts`、`server.ts` 导出，保持旧路径兼容 1 个版本周期。

交付：

- 新目录结构
- 导出兼容层

验收标准：

- 不改业务行为，仅重组结构
- 旧 import 在过渡期可用

## 阶段 3：数据库与服务契约标准化

目标：沉淀可跨项目复用的数据和服务契约。

任务：

1. 明确 schema 升级策略（drizzle migration 文件）。
2. 抽象 `CalendarDbAdapter` 接口，减少对特定 auth schema 的硬耦合。
3. 将 config/events API 输入输出定义集中到 `types`。
4. 增加错误码与统一响应结构。

交付：

- migration 脚本
- adapter 接口
- API 契约文档

验收标准：

- 换宿主项目时只需替换 adapter，不改业务层逻辑

## 阶段 4：质量与发布

目标：把“能跑”变成“可长期维护”。

任务：

1. 单元测试：`dateUtils`、`recurrenceService`、`import/export`。
2. API 测试：events/config 的增删改查和权限校验。
3. UI 冒烟：CalendarPage + EventModal 主流程。
4. 文档：新增迁移接入文档和宿主示例。

交付：

- 测试覆盖与报告
- 对外接入文档

验收标准：

- CI 至少覆盖 typecheck + 核心测试 + build

---

## 6. 分层迁移映射（来源 -> 目标）

## 6.1 API/Server 层

- `profile-v1/src/modules/calendar/api/*` -> `sa2kit/src/calendar/server/routes/*`（建议）
- 兼容层保留：`sa2kit/src/calendar/api/*`
- 路由工厂：`sa2kit/src/calendar/routes/index.ts`（作为标准对外入口）

## 6.2 UI 层

- `profile-v1/src/modules/calendar/components/*` -> `sa2kit/src/calendar/ui/web/components/*`
- `profile-v1/src/modules/calendar/pages/*` -> `sa2kit/src/calendar/ui/web/pages/*`

## 6.3 Logic/Service 层

- `profile-v1/src/modules/calendar/hooks/*` -> `sa2kit/src/calendar/logic/hooks/*`
- `profile-v1/src/modules/calendar/services/*` -> `sa2kit/src/calendar/logic/services/*`

## 6.4 DB 层

- `profile-v1/src/modules/calendar/db/schema.ts` -> `sa2kit/src/calendar/db/schema.ts`
- `profile-v1/src/modules/calendar/db/calendarDbService.ts` -> `sa2kit/src/calendar/db/calendarDbService.ts`
- 差异点：sa2kit 已改为 DB 注入模式（SDK 化正确方向）

---

## 7. 建议的实施清单（可直接执行）

1. 修复 calendar API 鉴权 ID 类型（切到 numeric）。
2. 统一入口走 `routes/index.ts`，并在宿主显式注入 `db`。
3. 新建 `server/routes` 目录，逐步迁入 `api/*`。
4. 拆分为 `ui/web`、`logic`、`server` 三层，保留兼容导出。
5. 补 6 条核心测试：
   - 2 条 API（events/config）
   - 2 条 service（recurrence/import）
   - 2 条 utils/hook
6. 补 1 个宿主接入示例（Next.js App Router）。

---

## 8. 风险与回滚

主要风险：

- 路由路径和导出路径改动导致宿主引用失效。
- userId 类型调整影响 auth 与 calendar 的边界。
- DB 注入初始化时机不一致导致首请求失败。

回滚策略：

- 保留 `src/calendar/api/*` 与原导出至少 1 个版本周期。
- 引入 feature flag：`CALENDAR_USE_NEW_SERVER_ROUTES=true`。
- 若上线异常，快速切回旧路由导出与旧入口。

---

## 9. 最终建议（给当前项目）

如果目标是“给群里一个可执行、可落地的迁移方案”，建议按优先级执行：

- P0 本周：先完成类型与 DB 注入闭环，打通可运行。
- P1 下周：完成 showmasterpiece 风格目录重组和兼容导出。
- P2 随后：补测试与文档，形成稳定可复用日历模块。

这条路径投入最小、风险可控，并且能最快把 profile 的 calendar 能力稳定迁移到 sa2kit。
