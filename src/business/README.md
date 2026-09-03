# sa2kit/business

SA2Kit **业务层**：可选产品域；**多端同仓**，按 `domain/` + `server/` + `ui/{web,rn,taro}` 组织（启明星 ADR-002）。

## 依赖规则

- ✅ 可依赖 `sa2kit/common/*`
- ❌ 不可被 `common` 引用
- ❌ 子域之间避免交叉引用（见 ESLint `no-restricted-imports`）

## 模板

- 试点：[festivalCard/PLATFORMS.md](./festivalCard/PLATFORMS.md)
- 大域迁移计划：profile `docs/modules/*/DOMAIN-MIGRATION.md`

## 文档

- [ADR-002 多端 SDK](../../docs/adr/002-client-ready-multiplatform-sdk.md)
- [HOST-ONBOARDING](../../docs/HOST-ONBOARDING.md)
