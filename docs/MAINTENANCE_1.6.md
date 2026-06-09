# sa2kit 1.6.x 维护线（R2-604）

> **分支**：`maintenance/1.6`（自 tag `v1.6.114` 分出）  
> **策略**：仅 **critical fix**（安全、数据丢失、构建阻断）；不再新增业务或 common API。

## 适用场景

- 尚未升级到 2.0 的存量项目
- 需热修 1.6.x 线上问题

## 工作流

```bash
git fetch origin
git checkout maintenance/1.6
# 修复 → 版本 1.6.115+ → tag v1.6.115 → npm publish
```

## 与 2.0 关系

- 新功能、common 硬化：**仅 2.x**（见 [MIGRATION_1.x_to_2.0.md](./MIGRATION_1.x_to_2.0.md)）
- `main` 分支跟踪 **2.0** 开发；1.6 维护不反向合并到 main（除文档说明）

## 维护负责人检查项

- [ ] 安全依赖 bump（按需）
- [ ] 与 2.0 重复模块 **不** 双份演进
- [ ] CHANGELOG 1.6.x 章节记录每次 critical fix
