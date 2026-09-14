# sa2kit 包体拆分路线图（Phase E）

> 目标：接单客户仓 / RN / 小程序 **只装所需 entry**，避免 30MB+ `dist/` 全家桶误 import。  
> 关联：profile `docs/code-review/libraries/DOMAIN-MIGRATION-ROADMAP.md`（Phase F 大域）

## 现状（2026-09-03 实测）

| 路径 | 约体积 | 说明 |
|------|--------|------|
| `dist/` 合计 | ~30MB | common + business 全量 |
| `dist/business/mmd` | ~3.2MB | Three/MMD，**必须**子路径隔离 |
| `dist/common/auth` | ~1.1MB | 登录全家桶 |
| `dist/business/festivalCard` | ~1.1MB | Phase C 试点 |

## 短期（已可用）

### 客户仓只构建 common

```bash
cd sa2kit && pnpm run build:common
# 或 prepare 默认行为（不设 SA2KIT_WITH_BUSINESS）
```

profile monorepo 全量：

```bash
SA2KIT_WITH_BUSINESS=1 pnpm --filter sa2kit run build
```

### import 纪律

- ✅ `sa2kit/common/auth`、`…/file`、`…/ui`
- ✅ `sa2kit/business/festivalCard/ui/web`（按需）
- ❌ `sa2kit` 根、`sa2kit/business` 聚合 index（会拖入 MMD 等）

### 测量脚本

```bash
pnpm --filter sa2kit run measure:dist
```

输出各 entry `.mjs` 体积，用于 PR 回归对比。

## 中期（2.x 后续）

| 步骤 | 内容 | 验收 | 状态（H1-E · 2026-09-14） |
|------|------|------|---------------------------|
| E1 | `exports` 文档 + `measure:dist` CI 阈值告警 | 单 PR 不增 MMD entry >5% | ✅ 保持；`measure:dist` 为回归基线 |
| E2 | 可选 npm 包 `@sa2kit/common-auth` 等（workspace 内先拆） | 对外仍 `sa2kit/common/auth` 兼容 | ⏸ **延期** — 见下 |
| E3 | business 按域分包 `@sa2kit/biz-mmd` | Metro / 小程序只声明所需 peer | ⏸ **延期** — 见下 |

### H1-E 延期理由（明确）

1. **E1 已足够挡误用**：子路径 + `measure:dist` + HOST-ONBOARDING「禁止根/聚合 import」可覆盖当前接单；空目录演练（[HOST-ONBOARDING-DRILL-H1-P1.md](./HOST-ONBOARDING-DRILL-H1-P1.md)）已暴露「最小 UI 页仍可能打出数 MB」——优先靠文档与门禁，而非立刻拆发包名。  
2. **缺第二真实客户宿主**：E2/E3 的分包边界应等非 profile 付费仓出现后再定，避免为假想 Metro/小程序场景提前拆仓。  
3. **发布面优先**：先保证 npm publish 与本地 HEAD exports 对齐（如 `festivalCard/ui/web`），再谈 `@sa2kit/*` 物理分包。  

**触发重启 E2/E3**：出现第二宿主，或客户仓在遵循子路径纪律后仍无法把首屏包压到可接受阈值。

## 长期

- sa2kit monorepo 发包（蓝图 §6 中期）
- PLATFORMS CI：export 存在性 + 缺端 stub 与 `measure:dist` 联动

## 相关

- [HOST-ONBOARDING.md](./HOST-ONBOARDING.md)
- [COMMON-PLATFORMS-EXPORTS.md](./COMMON-PLATFORMS-EXPORTS.md)
