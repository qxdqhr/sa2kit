# 数据库迁移文件

## 📁 文件说明

- `001_create_tables.sql` - 创建数据库表结构

## 🚀 执行迁移

### 方法 1: 使用 psql 命令行

```bash
# 连接到数据库并执行迁移
psql $DATABASE_URL -f 001_create_tables.sql

# 或使用完整连接信息
psql -h localhost -U username -d database_name -f 001_create_tables.sql
```

### 方法 2: 使用 Drizzle Kit（推荐）

```bash
# 1. 确保已安装 drizzle-kit
pnpm add -D drizzle-kit

# 2. 创建 drizzle.config.ts
cat > drizzle.config.ts << 'EOF'
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/testYourself/server/drizzle-schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
EOF

# 3. 生成迁移文件
pnpm drizzle-kit generate:pg

# 4. 执行迁移
pnpm drizzle-kit push:pg
```

### 方法 3: 使用 Node.js 脚本

```typescript
// migrate.ts
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const client = postgres(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log('🚀 开始执行数据库迁移...');
    
    const sql = readFileSync(
      join(__dirname, '001_create_tables.sql'),
      'utf-8'
    );
    
    await client.unsafe(sql);
    
    console.log('✅ 迁移完成！');
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrate();
```

```bash
# 执行迁移脚本
tsx migrate.ts
```

## ✅ 验证迁移

### 检查表是否创建成功

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'test_yourself%';

-- 应该看到:
-- test_yourself_configs
-- test_yourself_config_usage
-- test_yourself_config_shares
```

### 查看表结构

```sql
-- 查看配置表结构
\d test_yourself_configs

-- 查看索引
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'test_yourself_configs';
```

### 查看示例数据

```sql
-- 查看插入的示例配置
SELECT id, name, description, result_count, is_default, created_at
FROM test_yourself_configs
ORDER BY created_at DESC;

-- 应该看到 2 条示例配置
```

## 🔄 回滚迁移

如果需要删除表（谨慎！）：

```sql
-- 删除所有表（会删除数据！）
DROP TABLE IF EXISTS test_yourself_config_shares CASCADE;
DROP TABLE IF EXISTS test_yourself_config_usage CASCADE;
DROP TABLE IF EXISTS test_yourself_configs CASCADE;

-- 删除触发器函数
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

## 📊 数据库表说明

### 1. test_yourself_configs (配置表)

主要字段：
- `id` - 配置唯一标识
- `name` - 配置名称
- `config` - 配置内容（JSONB）
- `is_default` - 是否为默认配置
- `usage_count` - 使用次数
- `created_by` - 创建者
- `organization_id` - 组织ID（多租户）

### 2. test_yourself_config_usage (使用记录表)

记录每次配置使用情况，用于统计分析：
- `config_id` - 关联的配置ID
- `user_id` - 用户ID
- `fingerprint` - 设备指纹
- `used_at` - 使用时间

### 3. test_yourself_config_shares (分享表)

管理配置的公开分享：
- `share_code` - 分享代码
- `config_id` - 关联的配置ID
- `password` - 访问密码（可选）
- `expires_at` - 过期时间

## 🎯 下一步

1. **测试连接**: 确保数据库连接正常
2. **运行迁移**: 执行 SQL 脚本
3. **验证结果**: 检查表和数据
4. **集成代码**: 使用数据库适配器

查看完整文档：
- [DATABASE_INTEGRATION_GUIDE.md](../../DATABASE_INTEGRATION_GUIDE.md)
- [DATABASE_QUICK_REFERENCE.md](../../DATABASE_QUICK_REFERENCE.md)

---

**提示**: 建议先在开发环境测试，确认无误后再在生产环境执行！
