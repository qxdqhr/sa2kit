# UniversalExport 快速接入指南

## 🚀 快速开始

### 1. 最简配置

```typescript
import { createUniversalExportService } from '@qhr123/sa2kit/universalExport/server';

// 零配置初始化（使用默认配置）
const exportService = createUniversalExportService();
```

### 2. 标准配置

```typescript
import { createUniversalExportService } from '@qhr123/sa2kit/universalExport/server';

const exportService = createUniversalExportService({
  db: drizzleDb, // 可选：如果需要导出配置管理
  exportDir: './exports', // 导出文件目录
  tempDir: './temp', // 临时文件目录
  maxRows: 100000, // 最多导出 10 万行
  enableStreaming: true, // 启用流式导出
  timeout: 300000, // 超时时间 5 分钟
});
```

### 3. 从环境变量初始化

```env
# .env
EXPORT_DIR=./exports
TEMP_DIR=./temp
EXPORT_MAX_ROWS=50000
```

```typescript
import { createExportServiceFromEnv } from '@qhr123/sa2kit/universalExport/server';

// 从环境变量自动加载配置
const exportService = createExportServiceFromEnv(drizzleDb);
```

## 📦 场景化预设

### 小型应用（数据量小）

```typescript
import {
  createUniversalExportService,
  createSmallAppPreset,
} from '@qhr123/sa2kit/universalExport/server';

const exportService = createUniversalExportService({
  ...createSmallAppPreset(),
  // 自动配置：
  // - maxRows: 10,000
  // - timeout: 60s
  // - enableStreaming: false
});
```

### 中型应用（默认配置）

```typescript
import {
  createUniversalExportService,
  createMediumAppPreset,
} from '@qhr123/sa2kit/universalExport/server';

const exportService = createUniversalExportService({
  ...createMediumAppPreset(),
  // 自动配置：
  // - maxRows: 100,000
  // - timeout: 5min
  // - enableStreaming: true
});
```

### 大型应用（数据量大）

```typescript
import {
  createUniversalExportService,
  createLargeAppPreset,
} from '@qhr123/sa2kit/universalExport/server';

const exportService = createUniversalExportService({
  ...createLargeAppPreset(),
  // 自动配置：
  // - maxRows: 1,000,000
  // - timeout: 10min
  // - enableStreaming: true
});
```

### 实时导出（快速响应）

```typescript
import {
  createUniversalExportService,
  createRealtimeExportPreset,
} from '@qhr123/sa2kit/universalExport/server';

const exportService = createUniversalExportService({
  ...createRealtimeExportPreset(),
  // 自动配置：
  // - maxRows: 5,000
  // - timeout: 30s
  // - enableStreaming: false
});
```

### 批量导出（离线处理）

```typescript
import {
  createUniversalExportService,
  createBatchExportPreset,
} from '@qhr123/sa2kit/universalExport/server';

const exportService = createUniversalExportService({
  ...createBatchExportPreset(),
  // 自动配置：
  // - maxRows: 无限制
  // - timeout: 30min
  // - enableStreaming: true
});
```

### 智能预设（自动选择）

```typescript
import {
  createUniversalExportService,
  createSmartExportPreset,
} from '@qhr123/sa2kit/universalExport/server';

// 根据环境变量自动选择合适的预设
const exportService = createUniversalExportService({
  ...createSmartExportPreset(),
});
```

## ✅ 配置验证

```typescript
import {
  validateExportConfig,
  validateExportEnvironment,
  ExportConfigValidationError,
} from '@qhr123/sa2kit/universalExport/server';

try {
  // 验证环境变量
  validateExportEnvironment(['EXPORT_DIR', 'TEMP_DIR']);

  // 验证配置对象
  validateExportConfig(config);
} catch (error) {
  if (error instanceof ExportConfigValidationError) {
    console.error(`配置错误 [${error.field}]: ${error.message}`);
  }
}
```

## 🎯 使用示例

### CSV 导出

```typescript
import { createUniversalExportService } from '@qhr123/sa2kit/universalExport/server';

const exportService = createUniversalExportService();

// 导出用户数据到 CSV
const result = await exportService.export({
  format: 'csv',
  filename: 'users.csv',
  data: users,
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '姓名' },
    { key: 'email', label: '邮箱' },
    { key: 'createdAt', label: '创建时间', type: 'date' },
  ],
});
```

### Excel 导出

```typescript
const result = await exportService.export({
  format: 'xlsx',
  filename: 'users.xlsx',
  data: users,
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '姓名' },
    { key: 'email', label: '邮箱' },
    { key: 'status', label: '状态', type: 'enum' },
  ],
  sheetName: '用户列表',
});
```

### JSON 导出

```typescript
const result = await exportService.export({
  format: 'json',
  filename: 'users.json',
  data: users,
  pretty: true, // 格式化输出
});
```

### 流式导出（大数据量）

```typescript
const stream = await exportService.exportStream({
  format: 'csv',
  filename: 'large-dataset.csv',
  dataSource: async (offset, limit) => {
    // 分页获取数据
    return await db.query.users.findMany({
      offset,
      limit,
    });
  },
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '姓名' },
  ],
  batchSize: 1000, // 每批处理 1000 条
});

// 监听进度
stream.on('progress', (progress) => {
  console.log(`导出进度: ${progress.percentage}%`);
});

// 监听完成
stream.on('finish', () => {
  console.log('导出完成');
});
```

## 🔧 工具函数

### 数据格式化

```typescript
import { formatFieldValue } from '@qhr123/sa2kit/universalExport/server';

const value = formatFieldValue(new Date(), {
  key: 'date',
  label: '日期',
  type: 'date',
  format: 'YYYY-MM-DD',
});
```

### 数据聚合

```typescript
import { aggregateData } from '@qhr123/sa2kit/universalExport/server';

const summary = aggregateData(data, [
  { field: 'amount', operation: 'sum' },
  { field: 'count', operation: 'avg' },
  { field: 'price', operation: 'max' },
]);
```

### 数据分组

```typescript
import { groupData } from '@qhr123/sa2kit/universalExport/server';

const grouped = groupData(data, {
  groupBy: ['category', 'status'],
  aggregations: [
    { field: 'amount', operation: 'sum' },
  ],
});
```

## 📚 类型定义

```typescript
import type {
  // 配置类型
  UniversalExportServiceConfig,
  ExportOptions,
  ExportField,
  ExportFilter,
  ExportSort,
  // 结果类型
  ExportResult,
  ExportProgress,
  ExportTask,
  // 接口
  IExportEngine,
  IDataSource,
  // 枚举
  ExportFormat,
  ExportStatus,
} from '@qhr123/sa2kit/universalExport/server';
```

## 🔄 高级用法

### 自定义字段格式化

```typescript
const result = await exportService.export({
  format: 'csv',
  filename: 'users.csv',
  data: users,
  fields: [
    {
      key: 'name',
      label: '姓名',
      formatter: (value) => value.toUpperCase(), // 自定义格式化
    },
    {
      key: 'status',
      label: '状态',
      type: 'enum',
      enumMap: {
        active: '活跃',
        inactive: '不活跃',
        banned: '已封禁',
      },
    },
  ],
});
```

### 数据过滤和排序

```typescript
const result = await exportService.export({
  format: 'xlsx',
  filename: 'filtered-users.xlsx',
  data: users,
  fields: [...],
  filters: [
    { field: 'status', operator: 'eq', value: 'active' },
    { field: 'createdAt', operator: 'gte', value: '2024-01-01' },
  ],
  sort: [
    { field: 'createdAt', order: 'desc' },
  ],
});
```

### 创建导出任务

```typescript
// 创建异步导出任务
const task = await exportService.createTask({
  format: 'xlsx',
  filename: 'large-export.xlsx',
  config: {
    fields: [...],
    filters: [...],
  },
});

// 查询任务状态
const status = await exportService.getTaskStatus(task.id);

// 下载完成的导出文件
if (status.status === 'completed') {
  const file = await exportService.downloadTask(task.id);
}
```

## 🛠️ 环境变量配置

```env
# 导出目录
EXPORT_DIR=./exports

# 临时文件目录
TEMP_DIR=./temp

# 最大导出行数
EXPORT_MAX_ROWS=100000

# 超时时间（毫秒）
EXPORT_TIMEOUT=300000
```

## 🔥 迁移指南

### 之前（LyricNote）

```typescript
import { UniversalExportService } from '@/lib/universalExport';
import { exportConfig } from '@/lib/config';

const service = new UniversalExportService(exportConfig);
```

### 现在（Sa2kit）

```typescript
import { createExportServiceFromEnv } from '@qhr123/sa2kit/universalExport/server';

const service = createExportServiceFromEnv(db);
```

## 💡 最佳实践

1. **小数据量**：使用 `createSmallAppPreset()` 或 `createRealtimeExportPreset()`
2. **中等数据量**：使用 `createMediumAppPreset()`（默认）
3. **大数据量**：使用 `createLargeAppPreset()` + 流式导出
4. **离线批处理**：使用 `createBatchExportPreset()` + 异步任务
5. **类型安全**：充分利用 TypeScript 类型定义
6. **配置验证**：在初始化前使用 `validateExportConfig()` 验证配置
7. **进度监听**：对大数据量导出使用进度回调，提升用户体验

## 🚨 常见问题

### 1. 导出文件太大怎么办？

使用流式导出和分页：

```typescript
const stream = await exportService.exportStream({
  format: 'csv',
  dataSource: async (offset, limit) => {
    return await fetchDataWithPagination(offset, limit);
  },
  batchSize: 1000,
});
```

### 2. 如何限制导出权限？

在导出前添加权限检查：

```typescript
async function exportWithAuth(userId: string, options: ExportOptions) {
  // 检查用户权限
  const hasPermission = await checkExportPermission(userId);
  if (!hasPermission) {
    throw new Error('无导出权限');
  }

  // 记录导出操作
  await logExportAction(userId, options);

  // 执行导出
  return await exportService.export(options);
}
```

### 3. 如何自定义导出格式？

可以组合多个字段格式化器：

```typescript
const result = await exportService.export({
  format: 'xlsx',
  data: users,
  fields: [
    {
      key: 'fullName',
      label: '全名',
      formatter: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'age',
      label: '年龄段',
      formatter: (age) => {
        if (age < 18) return '未成年';
        if (age < 60) return '成年';
        return '老年';
      },
    },
  ],
});
```

### 4. 环境变量未生效？

确保在初始化前已加载环境变量：

```typescript
import 'dotenv/config';
import { createExportServiceFromEnv } from '@qhr123/sa2kit/universalExport/server';

const service = createExportServiceFromEnv();
```

## 📊 性能建议

| 数据量 | 推荐预设 | 推荐格式 | 流式导出 |
|--------|----------|----------|----------|
| < 5K   | Small/Realtime | CSV/JSON | 否 |
| 5K - 50K | Medium | CSV/XLSX | 可选 |
| 50K - 500K | Large | CSV | 是 |
| > 500K | Batch | CSV | 是 |

## 🎓 进阶资源

- [API 完整文档](./API_REFERENCE.md)
- [自定义引擎开发](./CUSTOM_ENGINE.md)
- [性能优化指南](./PERFORMANCE.md)

