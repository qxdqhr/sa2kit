# Business exports 变更与移除时间表（R2-403 / R2-406）

## 已移除 subpath

详见 **[business-exports-trimmed.md](./business-exports-trimmed.md)**。

## 计划移除 entire module（npm export + 源码）

| 模块 | 状态 | 移除 export 目标 | 删除 sa2kit 源码目标 | 说明 |
|------|------|------------------|----------------------|------|
| showmasterpiece | ✅ 已完成 | alpha.3 | alpha.3 | 已迁 profile-v1 |
| bubbleShooter | ✅ export 已移除 | — | beta.0 前 | profile-v1 已本地化 |
| huarongdao | ✅ 已完成 | 2.0.0 | 2.0.0 | 已迁 profile-v1 `src/modules/huarongdao` |
| mikuFlick | ✅ 已完成 | 2.0.0 | 2.0.0 | 已迁 profile-v1 `src/modules/mikuFlick` |

## 恢复或新增导出

编辑 `tsup.entries.business.ts` → `pnpm exports:sync` → `pnpm build:business`。
