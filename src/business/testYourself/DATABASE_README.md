# TestYourself 数据库存储方案

> 🎯 从 localStorage 升级到企业级数据库存储

## 📚 文档导航

### 🚀 快速开始

**推荐阅读顺序**：

1. **[快速参考 (DATABASE_QUICK_REFERENCE.md)](./DATABASE_QUICK_REFERENCE.md)** ⚡
   - 5分钟快速启动
   - 常用代码片段
   - 最佳实践

2. **[完整集成指南 (DATABASE_INTEGRATION_GUIDE.md)](./DATABASE_INTEGRATION_GUIDE.md)** 📘
   - 详细的步骤说明
   - API 实现示例
   - 前端集成方案
   - 数据迁移指南

### 📂 技术文档

- **[数据库表结构 (server/drizzle-schema.ts)](./server/drizzle-schema.ts)**
  - 3张核心表定义
  - 完整的字段说明
  - 索引设计
  - TypeScript 类型

- **[数据库适配器 (server/DatabaseConfigAdapter.ts)](./server/DatabaseConfigAdapter.ts)**
  - 实现 IConfigStorage 接口
  - 完整的 CRUD 操作
  - 多租户支持
  - 软删除功能

---

## 🎯 方案对比

### localStorage vs 数据库

| 特性 | localStorage | 数据库存储 |
|------|-------------|----------|
| **存储容量** | 5-10MB | 无限制 |
| **跨设备同步** | ❌ 不支持 | ✅ 完全支持 |
| **多用户协作** | ❌ 不支持 | ✅ 完全支持 |
| **数据安全** | ⚠️ 易被清除 | ✅ 服务端保护 |
| **权限控制** | ❌ 无 | ✅ 完整权限 |
| **使用统计** | ❌ 无法追踪 | ✅ 完整统计 |
| **版本控制** | ❌ 无 | ✅ 版本追踪 |
| **搜索查询** | ⚠️ 需遍历 | ✅ 索引查询 |
| **数据备份** | ⚠️ 手动 | ✅ 自动备份 |
| **团队协作** | ❌ 不支持 | ✅ 多租户 |

---

## 📊 数据库架构

### 核心表结构

```
┌─────────────────────────────────┐
│  test_yourself_configs          │  主配置表
│  ─────────────────────────────  │
│  - id (UUID)                    │
│  - name                         │
│  - config (JSONB)               │
│  - is_default                   │
│  - created_by                   │
│  - organization_id              │
│  - usage_count                  │
│  - version                      │
└─────────────────────────────────┘
            │
            ├──────────────────┐
            │                  │
            ▼                  ▼
┌──────────────────────┐  ┌────────────────────────┐
│ config_usage         │  │ config_shares          │
│ ──────────────────── │  │ ────────────────────── │
│ - config_id (FK)     │  │ - config_id (FK)       │
│ - user_id            │  │ - share_code           │
│ - fingerprint        │  │ - password             │
│ - used_at            │  │ - expires_at           │
└──────────────────────┘  └────────────────────────┘
   使用记录表              分享管理表
```

### 字段说明

**主配置表** (`test_yourself_configs`):
- ✅ 基本信息：name, description, tags
- ✅ 配置数据：config (JSONB)
- ✅ 状态管理：isDefault, isPublished, isArchived, isDeleted
- ✅ 权限控制：createdBy, organizationId
- ✅ 统计信息：usageCount, viewCount, lastUsedAt
- ✅ 版本控制：version, parentId

**使用记录表** (`test_yourself_config_usage`):
- 记录每次使用情况
- 用于数据分析和统计

**分享表** (`test_yourself_config_shares`):
- 支持配置公开分享
- 密码保护、访问限制

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

### 2. 配置环境变量

```env
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/your_database
```

### 3. 创建数据库表

```bash
# 生成迁移文件
pnpm drizzle-kit generate:pg

# 执行迁移
pnpm drizzle-kit push:pg
```

### 4. 使用数据库适配器

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  ConfigService, 
  createDatabaseConfigAdapter 
} from '@qhr123/sa2kit/testYourself/server';

// 1. 创建数据库连接
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

// 2. 创建数据库适配器
const dbAdapter = createDatabaseConfigAdapter({
  db,
  userId: 'user-123',
  organizationId: 'org-456', // 可选
});

// 3. 创建配置服务
const configService = new ConfigService({
  storageType: 'custom',
  customStorage: dbAdapter,
});

await configService.init();

// 4. 使用配置服务
const config = await configService.getDefaultConfig();
```

---

## 💡 核心功能

### ✅ 基础功能

- **CRUD 操作**: 完整的增删改查
- **默认配置**: 设置和获取默认配置
- **配置列表**: 查询所有配置
- **软删除**: 删除但保留数据，可恢复

### ✅ 高级功能

- **多租户**: organizationId 隔离不同租户数据
- **版本控制**: 追踪配置历史版本
- **使用统计**: 记录使用次数和时间
- **配置归档**: 归档不常用的配置
- **配置分享**: 生成分享链接，支持密码保护
- **权限管理**: 基于用户和组织的权限控制

### ✅ 企业级特性

- **审计日志**: 完整的操作历史
- **数据备份**: 数据库级别的备份恢复
- **搜索查询**: 基于索引的高效查询
- **批量操作**: 支持批量导入导出
- **缓存机制**: 内存缓存减少数据库压力

---

## 📖 使用示例

### 创建配置

```typescript
const config: SavedConfig = {
  id: crypto.randomUUID(),
  name: '性格测试',
  description: '测测你的性格类型',
  config: {
    gameTitle: '你是什么性格',
    results: [
      { id: '1', title: '外向型', description: '...', image: '😊' },
      { id: '2', title: '内向型', description: '...', image: '😌' },
    ],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

await configService.saveConfig(config);
```

### 查询配置

```typescript
// 获取所有配置
const configs = await configService.getAllConfigs();

// 获取默认配置
const defaultConfig = await configService.getDefaultConfig();

// 获取单个配置
const config = await configService.getConfig(configId);
```

### 更新配置

```typescript
const updated = {
  ...config,
  name: '新名称',
  updatedAt: Date.now(),
};

await configService.updateConfig(configId, updated);
```

### 删除配置

```typescript
// 软删除（可恢复）
await configService.deleteConfig(configId);

// 恢复删除的配置
await dbAdapter.restoreConfig(configId);
```

---

## 🔧 API 集成

### Next.js App Router

```typescript
// app/api/test-configs/route.ts
import { NextResponse } from 'next/server';
import { getConfigService } from '@/services/config';

export async function GET() {
  const service = getConfigService();
  const configs = await service.getAllConfigs();
  return NextResponse.json({ configs });
}

export async function POST(request: Request) {
  const body = await request.json();
  const service = getConfigService();
  
  const config = {
    id: crypto.randomUUID(),
    ...body,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  await service.saveConfig(config);
  return NextResponse.json({ config });
}
```

**完整 API 示例**: 见 [集成指南 - API实现](./DATABASE_INTEGRATION_GUIDE.md#api实现)

---

## 🔄 数据迁移

### 从 localStorage 迁移

**步骤 1**: 导出 localStorage 数据

```javascript
// 在浏览器控制台执行
const configs = JSON.parse(localStorage.getItem('test-yourself-configs') || '[]');
console.log(JSON.stringify(configs, null, 2));
// 复制输出结果
```

**步骤 2**: 批量导入到数据库

```typescript
const configs: SavedConfig[] = [/* 从 localStorage 复制的数据 */];

for (const config of configs) {
  await configService.saveConfig(config);
  console.log(`✅ 已导入: ${config.name}`);
}
```

**详细迁移指南**: 见 [集成指南 - 数据迁移](./DATABASE_INTEGRATION_GUIDE.md#数据迁移)

---

## 📊 统计查询

### 热门配置

```typescript
import { desc } from 'drizzle-orm';
import { testYourselfConfigs } from '@qhr123/sa2kit/testYourself/server';

const popular = await db
  .select()
  .from(testYourselfConfigs)
  .orderBy(desc(testYourselfConfigs.usageCount))
  .limit(10);
```

### 最近创建

```typescript
const recent = await db
  .select()
  .from(testYourselfConfigs)
  .orderBy(desc(testYourselfConfigs.createdAt))
  .limit(10);
```

**更多查询示例**: 见 [快速参考 - 统计查询](./DATABASE_QUICK_REFERENCE.md#统计查询)

---

## 🎯 应用场景

### 个人应用

- ✅ 存储个人配置
- ✅ 跨设备同步
- ✅ 配置历史版本

### 团队协作

- ✅ 共享配置模板
- ✅ 权限管理
- ✅ 协作编辑

### SaaS 平台

- ✅ 多租户隔离
- ✅ 配置市场
- ✅ 使用统计分析

### 企业应用

- ✅ 审计日志
- ✅ 数据备份
- ✅ 合规性支持

---

## 🔒 安全性

### 数据安全

- ✅ 服务端存储，防止篡改
- ✅ SQL 注入防护（参数化查询）
- ✅ 软删除保留历史数据

### 权限控制

- ✅ 用户级别权限
- ✅ 组织级别隔离
- ✅ 操作审计日志

### 数据备份

- ✅ 数据库自动备份
- ✅ 版本控制追踪
- ✅ 恢复已删除数据

---

## ⚡ 性能优化

### 数据库优化

- ✅ 完整的索引设计
- ✅ JSONB 字段高效查询
- ✅ 批量操作支持

### 缓存机制

- ✅ 内存缓存（可选）
- ✅ 减少数据库查询
- ✅ 智能缓存失效

### 查询优化

- ✅ 分页查询
- ✅ 按需加载
- ✅ 连接池管理

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [快速参考](./DATABASE_QUICK_REFERENCE.md) | 常用代码片段 |
| [集成指南](./DATABASE_INTEGRATION_GUIDE.md) | 完整集成步骤 |
| [数据库Schema](./server/drizzle-schema.ts) | 表结构定义 |
| [数据库适配器](./server/DatabaseConfigAdapter.ts) | 适配器实现 |
| [ConfigService](./server/ConfigService.ts) | 配置服务 |

---

## ✅ 功能检查清单

### 基础功能

- [x] 保存配置
- [x] 获取配置
- [x] 更新配置
- [x] 删除配置
- [x] 查询列表
- [x] 默认配置

### 高级功能

- [x] 软删除
- [x] 恢复删除
- [x] 多租户
- [x] 版本控制
- [x] 使用统计
- [x] 配置归档
- [x] 配置分享

### 企业功能

- [x] 权限控制
- [x] 审计日志
- [x] 批量操作
- [x] 数据备份
- [x] 搜索查询
- [x] 缓存机制

---

## 🎉 开始使用

1. **阅读**: [快速参考](./DATABASE_QUICK_REFERENCE.md) 快速上手
2. **学习**: [集成指南](./DATABASE_INTEGRATION_GUIDE.md) 深入了解
3. **实践**: 在你的项目中集成数据库存储
4. **优化**: 根据实际需求调整配置

---

## 🆘 获取帮助

- **文档**: 查看完整集成指南
- **示例**: 参考快速参考手册
- **问题**: 提交 GitHub Issue

---

**MIT License © 2024**  
**维护者**: Sa2kit Team

---

> 💡 **提示**: 从 localStorage 迁移到数据库是一次性工作，但会带来长期收益！
