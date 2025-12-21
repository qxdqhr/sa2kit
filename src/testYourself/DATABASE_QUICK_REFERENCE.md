# TestYourself 数据库存储快速参考

> 常用代码片段和最佳实践

## 🚀 5分钟快速启动

```typescript
// 1. 安装依赖
// pnpm add drizzle-orm postgres

// 2. 环境变量
DATABASE_URL=postgresql://localhost:5432/mydb

// 3. 创建数据库适配器
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createDatabaseConfigAdapter, ConfigService } from '@qhr123/sa2kit/testYourself/server';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const dbAdapter = createDatabaseConfigAdapter({
  db,
  userId: 'user-123',
  organizationId: 'org-456', // 可选
});

const configService = new ConfigService({
  storageType: 'custom',
  customStorage: dbAdapter,
});

await configService.init();

// 4. 使用配置服务
const config = {
  id: crypto.randomUUID(),
  name: '我的测试',
  config: {
    gameTitle: '测测你是什么动物',
    results: [/* 结果数据 */],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

await configService.saveConfig(config);
```

---

## 📝 常用操作

### 保存配置

```typescript
import type { SavedConfig } from '@qhr123/sa2kit/testYourself';

const config: SavedConfig = {
  id: crypto.randomUUID(),
  name: '性格测试',
  description: '测测你的性格类型',
  config: {
    gameTitle: '你是什么性格',
    buttonText: '开始测试',
    longPressDuration: 3000,
    results: [
      { id: '1', title: '外向型', description: '...', image: '😊', imageType: 'emoji' },
      { id: '2', title: '内向型', description: '...', image: '😌', imageType: 'emoji' },
    ],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isDefault: false,
};

await configService.saveConfig(config);
```

### 获取配置

```typescript
// 获取单个配置
const config = await configService.getConfig(configId);

// 获取所有配置
const allConfigs = await configService.getAllConfigs();

// 获取默认配置
const defaultConfig = await configService.getDefaultConfig();
```

### 更新配置

```typescript
const existing = await configService.getConfig(configId);

const updated = {
  ...existing,
  name: '新名称',
  config: {
    ...existing.config,
    gameTitle: '新标题',
  },
  updatedAt: Date.now(),
};

await configService.updateConfig(configId, updated);
```

### 删除配置

```typescript
// 软删除（可恢复）
await configService.deleteConfig(configId);

// 恢复已删除的配置
await dbAdapter.restoreConfig(configId);
```

### 设置默认配置

```typescript
// 设置默认配置
await configService.setDefaultConfig(configId);

// 获取默认配置
const defaultConfig = await configService.getDefaultConfig();
```

---

## 🔧 API 路由示例

### 最小化 API

```typescript
// app/api/test-configs/route.ts
import { NextResponse } from 'next/server';
import { getConfigService } from '@/services/config';

// 获取配置列表
export async function GET() {
  const service = getConfigService();
  const configs = await service.getAllConfigs();
  return NextResponse.json({ configs });
}

// 创建配置
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

### 完整 CRUD API

```typescript
// GET /api/test-configs
export async function GET(request: NextRequest) {
  const service = getConfigService(getUserId(request));
  const configs = await service.getAllConfigs();
  return NextResponse.json({ success: true, configs });
}

// POST /api/test-configs
export async function POST(request: NextRequest) {
  const body = await request.json();
  const service = getConfigService(getUserId(request));
  
  const config: SavedConfig = {
    id: crypto.randomUUID(),
    name: body.name,
    description: body.description,
    config: body.config,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  await service.saveConfig(config);
  return NextResponse.json({ success: true, config });
}

// GET /api/test-configs/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const service = getConfigService(getUserId(req));
  const config = await service.getConfig(params.id);
  
  if (!config) {
    return NextResponse.json({ error: '配置不存在' }, { status: 404 });
  }
  
  return NextResponse.json({ success: true, config });
}

// PUT /api/test-configs/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const service = getConfigService(getUserId(req));
  
  const updated = {
    ...body,
    updatedAt: Date.now(),
  };
  
  await service.updateConfig(params.id, updated);
  return NextResponse.json({ success: true, config: updated });
}

// DELETE /api/test-configs/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const service = getConfigService(getUserId(req));
  await service.deleteConfig(params.id);
  return NextResponse.json({ success: true });
}
```

---

## 🎨 前端集成

### React Hooks

```typescript
// hooks/useTestConfigs.ts
import { useState, useEffect } from 'react';
import type { SavedConfig } from '@qhr123/sa2kit/testYourself';

export function useTestConfigs() {
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test-configs');
      const data = await response.json();
      setConfigs(data.configs);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const createConfig = async (data: Partial<SavedConfig>) => {
    const response = await fetch('/api/test-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await loadConfigs();
    return response.json();
  };

  const deleteConfig = async (id: string) => {
    await fetch(`/api/test-configs/${id}`, { method: 'DELETE' });
    await loadConfigs();
  };

  return { configs, loading, createConfig, deleteConfig, reload: loadConfigs };
}
```

### 使用示例

```typescript
'use client';

import { useTestConfigs } from '@/hooks/useTestConfigs';

export function ConfigManager() {
  const { configs, loading, createConfig, deleteConfig } = useTestConfigs();

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <h1>配置管理</h1>
      
      {configs.map(config => (
        <div key={config.id}>
          <h3>{config.name}</h3>
          <p>{config.description}</p>
          <button onClick={() => deleteConfig(config.id)}>删除</button>
        </div>
      ))}
      
      <button onClick={() => createConfig({ name: '新配置', config: {} })}>
        创建配置
      </button>
    </div>
  );
}
```

---

## 🔒 权限控制

### 获取用户ID

```typescript
// 从请求头获取
function getUserId(request: NextRequest): string {
  return request.headers.get('x-user-id') || 'anonymous';
}

// 从 Session 获取
import { getServerSession } from 'next-auth';

async function getUserId(request: NextRequest): Promise<string> {
  const session = await getServerSession();
  return session?.user?.id || 'anonymous';
}
```

### 多租户隔离

```typescript
// 创建租户专属的配置服务
const { configService, dbAdapter } = createTestConfigService(
  userId,
  organizationId  // 租户ID
);

// 只会查询该租户的配置
const configs = await configService.getAllConfigs();
```

---

## 📊 统计查询

### 使用次数统计

```typescript
import { desc } from 'drizzle-orm';
import { testYourselfConfigs } from '@qhr123/sa2kit/testYourself/server';

// 最热门的配置
const popular = await db
  .select({
    id: testYourselfConfigs.id,
    name: testYourselfConfigs.name,
    usageCount: testYourselfConfigs.usageCount,
  })
  .from(testYourselfConfigs)
  .orderBy(desc(testYourselfConfigs.usageCount))
  .limit(10);
```

### 最近创建的配置

```typescript
const recent = await db
  .select()
  .from(testYourselfConfigs)
  .where(eq(testYourselfConfigs.isDeleted, false))
  .orderBy(desc(testYourselfConfigs.createdAt))
  .limit(10);
```

### 用户配置统计

```typescript
import { count, eq } from 'drizzle-orm';

const stats = await db
  .select({
    userId: testYourselfConfigs.createdBy,
    count: count(),
  })
  .from(testYourselfConfigs)
  .where(eq(testYourselfConfigs.isDeleted, false))
  .groupBy(testYourselfConfigs.createdBy);
```

---

## ⚡ 性能优化

### 启用缓存

```typescript
const configService = new ConfigService({
  storageType: 'custom',
  customStorage: dbAdapter,
  enableCache: true,  // ✅ 启用内存缓存
});
```

### 批量操作

```typescript
// ✅ 好：批量查询
const ids = ['id1', 'id2', 'id3'];
const configs = await db
  .select()
  .from(testYourselfConfigs)
  .where(inArray(testYourselfConfigs.id, ids));

// ❌ 不好：循环查询
for (const id of ids) {
  const config = await configService.getConfig(id);
}
```

---

## 🐛 调试技巧

### 查看 SQL 查询

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';

const db = drizzle(client, {
  logger: true,  // 启用 SQL 日志
});
```

### 检查连接

```typescript
// 测试数据库连接
try {
  const result = await db.select().from(testYourselfConfigs).limit(1);
  console.log('✅ 数据库连接正常');
} catch (error) {
  console.error('❌ 数据库连接失败:', error);
}
```

---

## 🔄 数据迁移

### 从 localStorage 导出

```typescript
// 在浏览器控制台执行
const configs = JSON.parse(localStorage.getItem('test-yourself-configs') || '[]');
console.log(JSON.stringify(configs, null, 2));
// 复制输出结果
```

### 批量导入

```typescript
const configs: SavedConfig[] = [/* 从 localStorage 导出的数据 */];

for (const config of configs) {
  await configService.saveConfig(config);
  console.log(`✅ 已导入: ${config.name}`);
}
```

---

## 📚 SQL 快速查询

```sql
-- 查看所有配置
SELECT id, name, created_by, usage_count, created_at
FROM test_yourself_configs
WHERE is_deleted = FALSE
ORDER BY created_at DESC;

-- 查看热门配置
SELECT name, usage_count, last_used_at
FROM test_yourself_configs
WHERE is_deleted = FALSE
ORDER BY usage_count DESC
LIMIT 10;

-- 查看用户配置
SELECT name, result_count, created_at
FROM test_yourself_configs
WHERE created_by = 'user-123'
  AND is_deleted = FALSE;

-- 删除所有已删除的配置（谨慎！）
DELETE FROM test_yourself_configs
WHERE is_deleted = TRUE
  AND deleted_at < NOW() - INTERVAL '30 days';

-- 统计配置数量
SELECT 
  COUNT(*) FILTER (WHERE is_deleted = FALSE) as active,
  COUNT(*) FILTER (WHERE is_deleted = TRUE) as deleted,
  COUNT(*) FILTER (WHERE is_archived = TRUE) as archived
FROM test_yourself_configs;
```

---

## ✅ 最佳实践

1. **使用软删除**: 保留数据历史，方便恢复
2. **启用缓存**: 减少数据库查询
3. **多租户隔离**: 通过 organizationId 隔离数据
4. **记录使用统计**: 调用 `incrementUsageCount`
5. **版本控制**: 使用 `parentId` 追踪版本
6. **定期清理**: 删除过期的临时数据

---

## 🆘 常见问题

**Q: 配置保存后查询不到？**  
A: 检查 `isDeleted` 字段，可能被软删除了

**Q: 多用户看到相同配置？**  
A: 设置 `organizationId` 实现多租户隔离

**Q: 如何恢复删除的配置？**  
A: 使用 `dbAdapter.restoreConfig(configId)`

**Q: 数据库查询慢？**  
A: 检查索引是否创建，启用缓存

---

## 📖 完整文档

- **集成指南**: [DATABASE_INTEGRATION_GUIDE.md](./DATABASE_INTEGRATION_GUIDE.md)
- **数据库Schema**: [server/drizzle-schema.ts](./server/drizzle-schema.ts)
- **适配器**: [server/DatabaseConfigAdapter.ts](./server/DatabaseConfigAdapter.ts)

---

快速参考手册 | MIT License © 2024
