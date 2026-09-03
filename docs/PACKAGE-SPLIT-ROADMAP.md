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

| 步骤 | 内容 | 验收 |
|------|------|------|
| E1 | `exports` 文档 + `measure:dist` CI 阈值告警 | 单 PR 不增 MMD entry >5% |
| E2 | 可选 npm 包 `@sa2kit/common-auth` 等（workspace 内先拆） | 对外仍 `sa2kit/common/auth` 兼容 |
| E3 | business 按域分包 `@sa2kit/biz-mmd` | Metro / 小程序只声明所需 peer |

## 长期

- sa2kit monorepo 发包（蓝图 §6 中期）
- PLATFORMS CI：export 存在性 + 缺端 stub 与 `measure:dist` 联动

## 相关

- [HOST-ONBOARDING.md](./HOST-ONBOARDING.md)
- [COMMON-PLATFORMS-EXPORTS.md](./COMMON-PLATFORMS-EXPORTS.md)
