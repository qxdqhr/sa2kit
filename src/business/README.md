# sa2kit/business

SA2Kit 2.0 **业务层**：具体产品域实现，后期逐步迁回 profile-v1。

## 子模块

| 目录 | npm 入口（legacy） | 迁回 profile-v1 |
|------|-------------------|-----------------|
| auth-legacy | 已删除（3.0）→ `common/auth` | 已收敛 |
| showmasterpiece | `sa2kit/showmasterpiece/*` | P0 — 已在 profile-v1 本地化 |
| huarongdao | 已迁 profile-v1 | — |
| bubbleShooter | `sa2kit/bubbleShooter/*` | P1 |
| mikuFlick | 已迁 profile-v1 | — |

## 依赖规则

- ✅ 可依赖 `sa2kit/common/*`
- ❌ 不可被 `common` 引用
- ❌ 子域之间避免交叉引用（见 ESLint `no-restricted-imports`）

详见 [REFACTOR_2.0_BACKLOG.md](../../docs/REFACTOR_2.0_BACKLOG.md)。
