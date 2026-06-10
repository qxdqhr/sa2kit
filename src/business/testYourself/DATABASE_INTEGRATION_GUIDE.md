# TestYourself 数据库存储集成指南

> 将配置从 localStorage 迁移到数据库存储

## 📋 目录

- [为什么使用数据库存储](#为什么使用数据库存储)
- [快速开始](#快速开始)
- [数据库配置](#数据库配置)
- [服务端集成](#服务端集成)
- [API实现](#api实现)
- [前端集成](#前端集成)
- [数据迁移](#数据迁移)
- [高级功能](#高级功能)

---

## 🎯 为什么使用数据库存储

### localStorage 的局限性

❌ **不适合多用户**: localStorage 是浏览器本地存储，无法跨设备同步  
❌ **容量限制**: 通常只有 5-10MB 存储空间  
❌ **无法协作**: 无法实现配置共享和团队协作  
❌ **数据安全**: 容易被用户清除或篡改  
❌ **无法统计**: 无法追踪配置使用情况

### 数据库存储的优势

✅ **多用户支持**: 跨设备同步，多端访问  
✅ **无容量限制**: 存储大量配置和历史版本  
✅ **协作功能**: 支持配置共享、团队协作  
✅ **数据安全**: 服务端存储，权限控制  
✅ **统计分析**: 完整的使用数据和访问日志  
✅ **版本控制**: 配置历史追踪和回滚  
✅ **企业级功能**: 多租户、归档、审计等

---

## 🚀 快速开始

### 步骤 1：安装依赖

```bash
# 核心依赖
pnpm add drizzle-orm postgres

# 开发依赖
pnpm add -D drizzle-kit
```

### 步骤 2：环境变量

```env
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/your_database
```

### 步骤 3：创建数据库表

```bash
# 生成迁移文件
pnpm drizzle-kit generate:pg

# 执行迁移
pnpm drizzle-kit push:pg
```

### 步骤 4：使用数据库适配器

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ConfigService, createDatabaseConfigAdapter } from '@qhr123/sa2kit/testYourself/server';

// 创建数据库连接
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

// 创建数据库适配器
const dbAdapter = createDatabaseConfigAdapter({
  db,
  userId: 'user-123',
  organizationId: 'org-456', // 可选，多租户支持
});

// 创建配置服务
const configService = new ConfigService({
  storageType: 'custom',
  customStorage: dbAdapter,
});

await configService.init();
```

---

## 💾 数据库配置

### 表结构说明

#### 1. 主配置表 `test_yourself_configs`

```sql
CREATE TABLE test_yourself_configs (
    -- 主键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 基本信息
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]',
    
    -- 配置数据
    config JSONB NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    
    -- 状态字段
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 权限和所有权
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    organization_id VARCHAR(255),
    
    -- 统计信息
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP,
    view_count INTEGER NOT NULL DEFAULT 0,
    
    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,
    parent_id UUID,
    
    -- 自定义字段
    metadata JSONB,
    source VARCHAR(50),
    
    -- 时间戳
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,
    archived_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

#### 2. 使用记录表 `test_yourself_config_usage`

```sql
CREATE TABLE test_yourself_config_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES test_yourself_configs(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    fingerprint TEXT,
    result_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    used_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completion_time INTEGER,
    metadata JSONB
);
```

#### 3. 分享表 `test_yourself_config_shares`

```sql
CREATE TABLE test_yourself_config_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_code VARCHAR(20) NOT NULL UNIQUE,
    config_id UUID NOT NULL REFERENCES test_yourself_configs(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    password VARCHAR(100),
    max_access INTEGER,
    access_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 使用 Drizzle ORM（推荐）

**文件位置**: `src/testYourself/server/drizzle-schema.ts`

这个文件已经包含了完整的表定义，包括：
- 完整的字段定义
- 索引优化
- 类型推导
- 关系定义

---

## 🔧 服务端集成

### 创建数据库连接

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as testYourselfSchema from '@/testYourself/server/drizzle-schema';

const queryClient = postgres(process.env.DATABASE_URL!);

export const db = drizzle(queryClient, {
  schema: testYourselfSchema,
});

export type Database = typeof db;
```

### 创建配置服务

```typescript
// src/services/test-config-service.ts
import { db } from '@/db';
import {
  ConfigService,
  createDatabaseConfigAdapter,
} from '@qhr123/sa2kit/testYourself/server';

/**
 * 创建数据库配置适配器
 */
export function createTestConfigService(userId: string, organizationId?: string) {
  // 创建数据库适配器
  const dbAdapter = createDatabaseConfigAdapter({
    db,
    userId,
    organizationId,
    softDelete: true, // 启用软删除
  });

  // 创建配置服务
  const configService = new ConfigService({
    storageType: 'custom',
    customStorage: dbAdapter,
    enableCache: true, // 启用内存缓存
  });

  return { configService, dbAdapter };
}

// 单例模式（可选）
let globalConfigService: ConfigService | null = null;

export function getConfigService(userId?: string): ConfigService {
  if (!globalConfigService) {
    const { configService } = createTestConfigService(userId || 'system');
    globalConfigService = configService;
  }
  return globalConfigService;
}
```

---

## 📡 API实现

### Next.js App Router 示例

#### 1. 创建配置 API

```typescript
// app/api/test-configs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createTestConfigService } from '@/services/test-config-service';
import type { SavedConfig } from '@qhr123/sa2kit/testYourself';

/**
 * 创建配置
 * POST /api/test-configs
 */
export async function POST(request: NextRequest) {
  try {
    // 获取用户信息
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const organizationId = request.headers.get('x-organization-id') || undefined;

    // 解析请求体
    const body = await request.json();
    const { name, description, config } = body;

    // 验证必需字段
    if (!name || !config) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      );
    }

    // 创建配置服务
    const { configService } = createTestConfigService(userId, organizationId);
    await configService.init();

    // 保存配置
    const savedConfig: SavedConfig = {
      id: crypto.randomUUID(),
      name,
      description,
      config,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false,
    };

    await configService.saveConfig(savedConfig);

    return NextResponse.json({
      success: true,
      config: savedConfig,
    });
  } catch (error) {
    console.error('创建配置失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建失败',
      },
      { status: 500 }
    );
  }
}

/**
 * 获取配置列表
 * GET /api/test-configs
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const organizationId = request.headers.get('x-organization-id') || undefined;

    // 创建配置服务
    const { configService } = createTestConfigService(userId, organizationId);
    await configService.init();

    // 获取所有配置
    const configs = await configService.getAllConfigs();

    return NextResponse.json({
      success: true,
      configs,
      total: configs.length,
    });
  } catch (error) {
    console.error('获取配置列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      },
      { status: 500 }
    );
  }
}
```

#### 2. 单个配置操作 API

```typescript
// app/api/test-configs/[configId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createTestConfigService } from '@/services/test-config-service';

/**
 * 获取单个配置
 * GET /api/test-configs/:configId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  try {
    const { configId } = params;
    const userId = request.headers.get('x-user-id') || 'anonymous';

    const { configService } = createTestConfigService(userId);
    await configService.init();

    const config = await configService.getConfig(configId);

    if (!config) {
      return NextResponse.json(
        { success: false, error: '配置不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新配置
 * PUT /api/test-configs/:configId
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  try {
    const { configId } = params;
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const body = await request.json();

    const { configService, dbAdapter } = createTestConfigService(userId);
    await configService.init();

    // 获取现有配置
    const existing = await configService.getConfig(configId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: '配置不存在' },
        { status: 404 }
      );
    }

    // 更新配置
    const updatedConfig = {
      ...existing,
      ...body,
      updatedAt: Date.now(),
    };

    await configService.updateConfig(configId, updatedConfig);

    return NextResponse.json({
      success: true,
      config: updatedConfig,
    });
  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除配置
 * DELETE /api/test-configs/:configId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  try {
    const { configId } = params;
    const userId = request.headers.get('x-user-id') || 'anonymous';

    const { configService } = createTestConfigService(userId);
    await configService.init();

    await configService.deleteConfig(configId);

    return NextResponse.json({
      success: true,
      message: '配置已删除',
    });
  } catch (error) {
    console.error('删除配置失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
}
```

#### 3. 默认配置 API

```typescript
// app/api/test-configs/default/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createTestConfigService } from '@/services/test-config-service';

/**
 * 获取默认配置
 * GET /api/test-configs/default
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous';

    const { configService } = createTestConfigService(userId);
    await configService.init();

    const defaultConfig = await configService.getDefaultConfig();

    if (!defaultConfig) {
      return NextResponse.json(
        { success: false, error: '未设置默认配置' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config: defaultConfig,
    });
  } catch (error) {
    console.error('获取默认配置失败:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}

/**
 * 设置默认配置
 * POST /api/test-configs/default
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const { configId } = await request.json();

    if (!configId) {
      return NextResponse.json(
        { success: false, error: '缺少 configId' },
        { status: 400 }
      );
    }

    const { configService } = createTestConfigService(userId);
    await configService.init();

    await configService.setDefaultConfig(configId);

    return NextResponse.json({
      success: true,
      message: '默认配置已设置',
    });
  } catch (error) {
    console.error('设置默认配置失败:', error);
    return NextResponse.json(
      { success: false, error: '设置失败' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 前端集成

### 使用 API 客户端

```typescript
// src/lib/test-config-api.ts

export interface TestConfigAPI {
  createConfig(data: { name: string; description?: string; config: any }): Promise<any>;
  getConfigs(): Promise<any>;
  getConfig(id: string): Promise<any>;
  updateConfig(id: string, data: any): Promise<any>;
  deleteConfig(id: string): Promise<any>;
  getDefaultConfig(): Promise<any>;
  setDefaultConfig(id: string): Promise<any>;
}

/**
 * 测试配置 API 客户端
 */
export class TestConfigClient implements TestConfigAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/test-configs') {
    this.baseUrl = baseUrl;
  }

  private async request(url: string, options?: RequestInit) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '请求失败');
    }

    return response.json();
  }

  async createConfig(data: { name: string; description?: string; config: any }) {
    return this.request(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConfigs() {
    return this.request(this.baseUrl);
  }

  async getConfig(id: string) {
    return this.request(`${this.baseUrl}/${id}`);
  }

  async updateConfig(id: string, data: any) {
    return this.request(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteConfig(id: string) {
    return this.request(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  async getDefaultConfig() {
    return this.request(`${this.baseUrl}/default`);
  }

  async setDefaultConfig(id: string) {
    return this.request(`${this.baseUrl}/default`, {
      method: 'POST',
      body: JSON.stringify({ configId: id }),
    });
  }
}

// 创建单例
export const testConfigClient = new TestConfigClient();
```

### React 组件示例

```typescript
'use client';

import { useState, useEffect } from 'react';
import { testConfigClient } from '@/lib/test-config-api';
import type { SavedConfig } from '@qhr123/sa2kit/testYourself';

export function ConfigListPage() {
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const result = await testConfigClient.getConfigs();
      setConfigs(result.configs);
    } catch (error) {
      console.error('加载失败:', error);
      alert('加载配置列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) return;

    try {
      await testConfigClient.deleteConfig(id);
      alert('删除成功');
      await loadConfigs();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await testConfigClient.setDefaultConfig(id);
      alert('已设置为默认配置');
      await loadConfigs();
    } catch (error) {
      console.error('设置失败:', error);
      alert('设置默认配置失败');
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">配置列表</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => (
          <div
            key={config.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold">{config.name}</h3>
              {config.isDefault && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  默认
                </span>
              )}
            </div>

            {config.description && (
              <p className="text-sm text-gray-600 mb-3">{config.description}</p>
            )}

            <div className="text-xs text-gray-500 mb-3">
              <p>结果数量: {config.config.results?.length || 0}</p>
              <p>创建时间: {new Date(config.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSetDefault(config.id)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={config.isDefault}
              >
                设为默认
              </button>
              <button
                onClick={() => handleDelete(config.id)}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {configs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          暂无配置，请创建第一个配置
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 数据迁移

### 从 localStorage 迁移到数据库

```typescript
// scripts/migrate-configs.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createDatabaseConfigAdapter } from '@/testYourself/server/DatabaseConfigAdapter';
import type { SavedConfig } from '@/testYourself/types';

/**
 * 从 localStorage 导出配置
 */
function exportFromLocalStorage(): SavedConfig[] {
  if (typeof window === 'undefined') {
    console.error('此脚本需要在浏览器环境运行');
    return [];
  }

  const STORAGE_KEY = 'test-yourself-configs';
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    console.log('localStorage 中没有找到配置');
    return [];
  }

  try {
    const configs: SavedConfig[] = JSON.parse(data);
    console.log(`找到 ${configs.length} 个配置`);
    return configs;
  } catch (error) {
    console.error('解析配置失败:', error);
    return [];
  }
}

/**
 * 导入配置到数据库
 */
async function importToDatabase(configs: SavedConfig[], userId: string) {
  // 创建数据库连接
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  // 创建数据库适配器
  const adapter = createDatabaseConfigAdapter({
    db,
    userId,
  });

  console.log(`开始导入 ${configs.length} 个配置...`);

  let successCount = 0;
  let errorCount = 0;

  for (const config of configs) {
    try {
      await adapter.saveConfig(config);
      successCount++;
      console.log(`✅ 已导入: ${config.name}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ 导入失败: ${config.name}`, error);
    }
  }

  console.log(`\n导入完成:`);
  console.log(`  成功: ${successCount}`);
  console.log(`  失败: ${errorCount}`);

  await client.end();
}

/**
 * 迁移主函数
 */
async function migrate() {
  console.log('=== TestYourself 配置迁移工具 ===\n');

  // 1. 从 localStorage 导出
  const configs = exportFromLocalStorage();

  if (configs.length === 0) {
    console.log('没有需要迁移的配置');
    return;
  }

  // 2. 导入到数据库
  const userId = process.env.USER_ID || 'migration-user';
  await importToDatabase(configs, userId);

  console.log('\n迁移完成！');
}

// 运行迁移
migrate().catch(console.error);
```

### 使用迁移脚本

```bash
# 1. 在浏览器控制台导出配置
# 打开浏览器控制台，执行：
const configs = JSON.parse(localStorage.getItem('test-yourself-configs'));
console.log(JSON.stringify(configs, null, 2));
# 复制输出的 JSON

# 2. 保存到文件
# 创建 configs.json 文件，粘贴配置数据

# 3. 导入到数据库
node scripts/import-configs.js configs.json
```

---

## 🎯 高级功能

### 1. 多租户支持

```typescript
// 为不同组织创建独立的配置空间
const { configService } = createTestConfigService(
  userId,
  'organization-123' // 组织ID
);

// 只会查询该组织的配置
const configs = await configService.getAllConfigs();
```

### 2. 版本控制

```typescript
// 创建配置新版本
const newVersion = {
  ...existingConfig,
  id: crypto.randomUUID(),
  parentId: existingConfig.id, // 指向父版本
  version: existingConfig.version + 1,
  updatedAt: Date.now(),
};

await configService.saveConfig(newVersion);
```

### 3. 配置归档

```typescript
// 归档配置（不删除，但隐藏）
await dbAdapter.archiveConfig(configId);

// 取消归档
await dbAdapter.unarchiveConfig(configId);
```

### 4. 软删除和恢复

```typescript
// 软删除（可恢复）
await configService.deleteConfig(configId);

// 恢复已删除的配置
await dbAdapter.restoreConfig(configId);
```

### 5. 使用统计

```typescript
// 记录配置使用
await dbAdapter.incrementUsageCount(configId);

// 查询使用统计
const stats = await db
  .select({
    configId: testYourselfConfigs.id,
    name: testYourselfConfigs.name,
    usageCount: testYourselfConfigs.usageCount,
    lastUsedAt: testYourselfConfigs.lastUsedAt,
  })
  .from(testYourselfConfigs)
  .orderBy(desc(testYourselfConfigs.usageCount))
  .limit(10);
```

---

## 📊 SQL 查询示例

```sql
-- 查询所有配置
SELECT id, name, description, result_count, usage_count, created_at
FROM test_yourself_configs
WHERE is_deleted = FALSE
ORDER BY created_at DESC;

-- 查询最常用的配置
SELECT name, usage_count, last_used_at
FROM test_yourself_configs
WHERE is_deleted = FALSE
ORDER BY usage_count DESC
LIMIT 10;

-- 查询某个用户的配置
SELECT *
FROM test_yourself_configs
WHERE created_by = 'user-123'
  AND is_deleted = FALSE;

-- 查询默认配置
SELECT *
FROM test_yourself_configs
WHERE is_default = TRUE
  AND is_deleted = FALSE
LIMIT 1;

-- 统计配置数量
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_published THEN 1 END) as published,
  COUNT(CASE WHEN is_archived THEN 1 END) as archived,
  COUNT(CASE WHEN is_deleted THEN 1 END) as deleted
FROM test_yourself_configs;
```

---

## ✅ 检查清单

### 数据库配置

- [ ] 安装依赖 (`drizzle-orm`, `postgres`)
- [ ] 配置环境变量（DATABASE_URL）
- [ ] 创建数据库表
- [ ] 测试数据库连接

### 服务端集成

- [ ] 创建数据库适配器
- [ ] 配置 ConfigService
- [ ] 创建配置 API 路由
- [ ] 测试 API 功能

### 前端集成

- [ ] 创建 API 客户端
- [ ] 更新 UI 组件
- [ ] 测试配置管理功能
- [ ] 删除 localStorage 相关代码

### 数据迁移

- [ ] 导出 localStorage 数据
- [ ] 导入到数据库
- [ ] 验证迁移结果
- [ ] 清理旧数据

---

## 🆘 故障排查

### 问题 1：数据库连接失败

```bash
# 检查环境变量
echo $DATABASE_URL

# 测试连接
psql $DATABASE_URL -c "SELECT 1"
```

### 问题 2：表不存在

```bash
# 生成并执行迁移
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push:pg
```

### 问题 3：权限错误

检查用户ID和组织ID是否正确设置：

```typescript
const { configService } = createTestConfigService(
  'correct-user-id',  // ✅ 使用正确的用户ID
  'correct-org-id'    // ✅ 使用正确的组织ID
);
```

---

## 📚 相关文档

- **类型定义**: [types.ts](./types.ts)
- **数据库Schema**: [server/drizzle-schema.ts](./server/drizzle-schema.ts)
- **适配器实现**: [server/DatabaseConfigAdapter.ts](./server/DatabaseConfigAdapter.ts)
- **ConfigService**: [server/ConfigService.ts](./server/ConfigService.ts)

---

完整的数据库存储方案已准备就绪！🎉

**MIT License © 2024**
