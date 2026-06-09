# 实验田游戏迁出评估（R2-406）

> **决策日期**：2026-06-09  
> **完成日期**：2026-06-09（`2.0.0` stable）  
> **范围**：`huarongdao`、`bubbleShooter`、`mikuFlick` 及 sa2kit `testField` 挂载关系

## 1. 现状

| 游戏 | sa2kit | profile-v1 | 状态 |
|------|--------|------------|------|
| **bubbleShooter** | ❌ 无 export | `src/modules/bubbleShooter` | ✅ 已完成 |
| **huarongdao** | ❌ 已删除 | `src/modules/huarongdao` | ✅ 已完成 |
| **mikuFlick** | ❌ 已删除 | `src/modules/mikuFlick` | ✅ 已完成 |

## 2. 决策（已执行）

| 模块 | 决策 | 完成版本 |
|------|------|----------|
| bubbleShooter | 本地化 profile-v1 | alpha 期 |
| huarongdao | 迁 `profile-v1/src/modules/huarongdao` | **2.0.0** |
| mikuFlick | 迁 `profile-v1/src/modules/mikuFlick` | **2.0.0** |

## 3. profile-v1 挂载

| 路由 | 模块 |
|------|------|
| `/testField/huarongdao` | `@/modules/huarongdao` + 页面定制 UI |
| `/testField/huarongdao/config` | `@/modules/testField/huarongdao/shared` |
| `/testField/mikuFlick` | `@/modules/mikuFlick` |

## 4. 验收标准

- [x] profile-v1 无 `sa2kit/huarongdao`、`sa2kit/mikuFlick` 直接 import
- [x] sa2kit 删除 export 与 `src/business/{huarongdao,mikuFlick}`
- [x] `pnpm exports:verify` — 87 entries
- [x] testField `experimentData` 登记两款游戏

## 5. 相关文档

- [business-exports-trimmed.md](./business-exports-trimmed.md)
- [business-deprecated-exports.md](./business-deprecated-exports.md)
- [REFACTOR_2.0_BACKLOG.md](./REFACTOR_2.0_BACKLOG.md) — R2-406 / R2-605
