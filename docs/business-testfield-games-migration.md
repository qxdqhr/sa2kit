# 实验田游戏迁出评估（R2-406）

> **决策日期**：2026-06-09  
> **范围**：`huarongdao`、`bubbleShooter`、`mikuFlick` 及 sa2kit `testField` 挂载关系

## 1. 现状

| 游戏 | sa2kit 路径 | npm export | profile-v1 状态 | testField 路由 |
|------|-------------|------------|-------------------|----------------|
| **bubbleShooter** | `src/business/bubbleShooter` | ❌ 已移除（见 trimmed 清单） | ✅ 已本地化 `src/modules/bubbleShooter` | 不依赖 sa2kit |
| **huarongdao** | `src/business/huarongdao` | `./huarongdao` barrel | ⚠️ 仍通过 sa2kit import | 未在 `experimentData` 登记 |
| **mikuFlick** | `src/business/mikuFlick` | `./mikuFlick` barrel | ⚠️ 仍通过 sa2kit import | 未在 `experimentData` 登记 |

**bubbleShooter** 已完成迁出模板：源码保留于 sa2kit 仅供联调，profile-v1 使用本地模块，npm 不再导出。

## 2. 评估维度

| 维度 | 留 sa2kit business | 迁 profile-v1 `testField` |
|------|-------------------|---------------------------|
| 构建体积 | 增加 business dist ~数百 KB | 仅 profile-v1 bundle |
| 迭代速度 | 需发 sa2kit alpha | 与站点同仓发布 |
| 复用性 | 其他 consumer 可引用 | 仅 profile-v1 |
| 复杂度 | 低（已分层 business） | 中（需复制路由 + 页面挂载） |

**结论**：三款游戏均属 **profile-v1 实验田专属**，无第三方 consumer；长期应 **迁回 profile-v1**，sa2kit 仅短期保留 barrel 兼容。

## 3. 决策

| 模块 | 决策 | 目标版本 |
|------|------|----------|
| bubbleShooter | ✅ **已完成**本地化 | — |
| huarongdao | 🔄 **迁 profile-v1**（`testField/huarongdao`） | `2.0.0-alpha.9` 移除 export |
| mikuFlick | 🔄 **迁 profile-v1**（`testField/mikuFlick`） | `2.0.0-alpha.10` 移除 export |

**保留 business 源码窗口期**：alpha.9 前仅 deprecated 警告；alpha.10 删除 npm exports；beta.0 前删除 sa2kit 源码（与 showmasterpiece 相同节奏）。

## 4. profile-v1 迁移清单（待执行）

### huarongdao

1. 复制 / 软链 `sa2kit/business/huarongdao` → `profile-v1/src/modules/huarongdao`
2. 页面挂载：`/testField/huarongdao`、`/testField/huarongdao/config`
3. 替换 import：`sa2kit/huarongdao` → `@/modules/huarongdao` 或相对路径
4. `experimentData.ts` 增加实验项条目
5. 删除 sa2kit `tsup.entries.business.ts` 中 `huarongdao/index`

### mikuFlick

1. 同上，目标 `profile-v1/src/modules/mikuFlick`
2. 路由 `/testField/mikuFlick`
3. 移除 sa2kit export

## 5. 验收标准

- [ ] profile-v1 无 `sa2kit/huarongdao`、`sa2kit/mikuFlick` 直接 import
- [ ] sa2kit `business-deprecated-exports.md` 时间表与本文一致
- [ ] `pnpm build:business` entry 数随移除递减
- [ ] testField 实验列表可点击进入两款游戏

## 6. 相关文档

- [business-exports-trimmed.md](./business-exports-trimmed.md)
- [business-deprecated-exports.md](./business-deprecated-exports.md)
- [REFACTOR_2.0_BACKLOG.md](./REFACTOR_2.0_BACKLOG.md) — R2-406 / R2-407
