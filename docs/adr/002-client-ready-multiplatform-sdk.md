# ADR-002：接单就绪的多端 SDK（business 同仓 · 不再迁出）

> **状态**：已接受 · 2026-09-03  
> **取代**：REFACTOR_2.0_BACKLOG §1.2 中「business 逐步迁回 profile-v1」方向  
> **蓝图 SSOT**：profile-v1 `docs/code-review/libraries/BLUEPRINT-multiplatform-sa2kit.md` §0 / §11

## 背景

sa2kit 1.x～2.0-alpha 曾将 `business/*` 视为「待迁回 profile 的临时交付物」。  
这与 **北极星（启明星）** 冲突：付费客户仓应直接 `npm i sa2kit`，引用 `common/*` 与可选 `business/*`，而不是复制 profile 源码或等待业务从库中删除。

Phase U（UI 统一化）已于 2026-08-29 验收；宿主 submodule + workspace 引用已于 2026-09-03 落地。

## 决定

1. **business 留在 sa2kit**，按蓝图 §2.2 骨架组织：`domain/`、`server/`、`ui/{web,rn,taro}`。  
2. **profile-v1 与客户仓均为薄宿主**：薄 `page.tsx`、`app/api` re-export、部署与鉴权 Guard；不复制业务 UI / DbService。  
3. **通用能力进 common**；UI 实现只在 **sa2kit-ui**，消费经 **`sa2kit/common/ui*`** 门面。  
4. **`*-core` 大域（calendar / teach-hub / showmasterpiece）S1 冻结**：不立刻整包下沉；新多端优先进 sa2kit `business/*`。  
5. **对外发布面不变**：独立 GitHub 仓 + npm（`sa2kit`、`@qhr123/sa2kit-ui-react` 等）；profile 内用 git submodule + `workspace:*`。

## 后果

| 正面 | 代价 |
|------|------|
| 下一单客户仓可复用登录/OSS/UI/试点 business | 须维护 PLATFORMS 矩阵与按端 exports |
| 消除「库 vs 宿主」双份 business 维护 | 大域 `*-core` 与 sa2kit business 短期双轨 |
| submodule 便于 profile 联调 + 仍可 npm 外接 | 子仓 commit + 父仓指针 bump 流程 |

## 执行清单（跟踪）

- [x] Phase U UI 统一（`pnpm gate:ui`）  
- [x] ADR-002 本文  
- [x] [HOST-ONBOARDING.md](../HOST-ONBOARDING.md) 新宿主接入清单  
- [x] [COMMON-PLATFORMS-EXPORTS.md](../COMMON-PLATFORMS-EXPORTS.md) common 按端导出表  
- [ ] Phase C：`festivalCard` 多端模板试点（见 `src/business/festivalCard/PLATFORMS.md`）  
- [ ] Phase D：主站纯 re-export 模块扫尾  

## 相关

- [REFACTOR_2.0_BACKLOG.md](../REFACTOR_2.0_BACKLOG.md) — 2.0 目录/构建任务（business 迁出优先级列 **作废**）  
- [MIGRATION_1.x_to_2.0.md](../MIGRATION_1.x_to_2.0.md)
