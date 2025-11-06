# Universal Export Service Documentation

通用导出服务模块提供灵活的数据导出功能，支持 CSV、Excel、JSON 等多种格式。

## 功能特性

- ✅ 多格式导出（CSV、Excel、JSON）
- ✅ 自定义字段配置
- ✅ 数据分组和转换
- ✅ 进度跟踪
- ✅ 模板化文件名
- ✅ 数据过滤和排序
- ✅ 批量导出
- ✅ 格式化函数支持

## 安装

```bash
pnpm add @qhr123/sa2kit
```

## 快速开始

### 基础使用

```typescript
import { universalExportClient } from '@qhr123/sa2kit/universalExport';

// 导出数据为 CSV
const exportData = async () => {
  const result = await universalExportClient.exportData({
    configId: 'my-export-config',
    dataSource: async () => [
      { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
    ],
    format: 'csv',
    callbacks: {
      onProgress: (progress) => {
        console.log(`导出进度: ${progress.progress}%`);
      },
      onSuccess: (result) => {
        console.log('导出完成:', result.fileName);
        // 下载文件
        downloadFile(result.fileBlob!, result.fileName);
      },
      onError: (error) => {
        console.error('导出失败:', error);
      },
    },
  });
};

// 下载文件辅助函数
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### 自定义导出配置

```typescript
import { universalExportClient, ExportConfig } from '@qhr123/sa2kit/universalExport';

// 创建导出配置
const config: ExportConfig = {
  id: 'user-export',
  name: '用户数据导出',
  description: '导出用户信息列表',
  format: 'csv',
  fields: [
    {
      key: 'id',
      label: '用户ID',
      type: 'number',
      enabled: true,
      width: 100,
      alignment: 'left',
    },
    {
      key: 'name',
      label: '姓名',
      type: 'string',
      enabled: true,
      width: 150,
      alignment: 'left',
    },
    {
      key: 'email',
      label: '邮箱',
      type: 'string',
      enabled: true,
      width: 200,
      alignment: 'left',
    },
    {
      key: 'createdAt',
      label: '创建时间',
      type: 'date',
      enabled: true,
      formatter: (value) => new Date(value).toLocaleDateString('zh-CN'),
    },
  ],
  fileNameTemplate: 'users-{date}',
  includeHeader: true,
  delimiter: ',',
  encoding: 'utf-8',
  addBOM: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  moduleId: 'user-management',
};

// 使用配置导出
await universalExportClient.exportData({
  configId: config,
  dataSource: fetchUsers,
});
```

### 数据过滤和排序

```typescript
import { universalExportClient } from '@qhr123/sa2kit/universalExport';

// 导出带过滤和排序的数据
const result = await universalExportClient.exportData({
  configId: 'user-export',
  dataSource: 'https://api.example.com/users',
  filters: [
    { field: 'status', operator: 'eq', value: 'active' },
    { field: 'age', operator: 'gte', value: 18 },
    { field: 'email', operator: 'contains', value: '@example.com' },
  ],
  sortBy: [
    { field: 'createdAt', direction: 'desc' },
    { field: 'name', direction: 'asc' },
  ],
  pagination: {
    page: 1,
    pageSize: 1000,
  },
});
```

### 数据分组导出

```typescript
import { universalExportClient, ExportConfig } from '@qhr123/sa2kit/universalExport';

// 创建分组配置
const config: ExportConfig = {
  id: 'sales-by-region',
  name: '按地区分组的销售数据',
  format: 'excel',
  fields: [
    { key: 'region', label: '地区', type: 'string', enabled: true },
    { key: 'product', label: '产品', type: 'string', enabled: true },
    { key: 'sales', label: '销售额', type: 'number', enabled: true },
  ],
  grouping: {
    enabled: true,
    fields: [
      {
        key: 'region',
        label: '地区',
        mode: 'merge',
        valueProcessing: 'sum',
        showGroupHeader: true,
        mergeCells: true,
      },
    ],
    preserveOrder: true,
    nullValueHandling: 'group',
    nullGroupName: '未分类',
  },
  fileNameTemplate: 'sales-by-region-{date}',
  includeHeader: true,
  delimiter: ',',
  encoding: 'utf-8',
  addBOM: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  moduleId: 'sales',
};

await universalExportClient.exportData({
  configId: config,
  dataSource: fetchSalesData,
});
```

## 工具函数

### 文件名生成

```typescript
import { generateExportFileName } from '@qhr123/sa2kit/universalExport';

// 生成带时间戳的文件名
const fileName = generateExportFileName('users-{date}-{time}', 'csv');
console.log(fileName); // "users-2025-11-05-14-30-25.csv"

// 使用时间戳
const fileName2 = generateExportFileName('export-{timestamp}', 'excel');
console.log(fileName2); // "export-1699190400000.xlsx"
```

### 数据验证

```typescript
import { validateFileName } from '@qhr123/sa2kit/universalExport';

// 验证文件名
if (!validateFileName('my-export.csv')) {
  console.error('文件名包含非法字符');
}
```

### 格式化器

```typescript
import { DEFAULT_FORMATTERS } from '@qhr123/sa2kit/universalExport';

// 使用内置格式化器
const formattedDate = DEFAULT_FORMATTERS.date(new Date());
const formattedDateTime = DEFAULT_FORMATTERS.datetime(new Date());
const formattedNumber = DEFAULT_FORMATTERS.number(1234.5678);
const formattedCurrency = DEFAULT_FORMATTERS.currency(1234.56);
const formattedPercent = DEFAULT_FORMATTERS.percentage(0.1234);
```

## 自定义客户端

```typescript
import { createExportClient } from '@qhr123/sa2kit/universalExport';

// 创建自定义导出客户端
const customClient = createExportClient({
  defaultFormat: 'excel',
  defaultDelimiter: ';',
  defaultEncoding: 'utf-8',
  defaultAddBOM: true,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxRowsLimit: 100000,
  maxConcurrentExports: 3,
  exportTimeout: 60000,
  cache: {
    configTTL: 3600,
    resultTTL: 1800,
  },
});

// 使用自定义客户端
await customClient.exportData({
  configId: 'my-config',
  dataSource: fetchData,
});
```

## 类型定义

### ExportConfig

```typescript
interface ExportConfig {
  id: string;
  name: string;
  description?: string;
  format: ExportFormat;
  fields: ExportField[];
  grouping?: GroupingConfig;
  fileNameTemplate: string;
  includeHeader: boolean;
  delimiter: string;
  encoding: string;
  addBOM: boolean;
  maxRows?: number;
  createdAt: Date;
  updatedAt: Date;
  moduleId: string;
  businessId?: string;
  createdBy?: string;
}
```

### ExportField

```typescript
interface ExportField {
  key: string;
  label: string;
  type: FieldType;
  enabled: boolean;
  width?: number;
  alignment?: FieldAlignment;
  formatter?: (value: any) => string;
  sortOrder?: number;
  required?: boolean;
  description?: string;
  style?: Record<string, any>;
}
```

### ExportRequest

```typescript
interface ExportRequest {
  configId: string | ExportConfig;
  dataSource: string | (() => Promise<any[]>);
  queryParams?: Record<string, any>;
  fieldMapping?: Record<string, string>;
  filters?: ExportFilter[];
  sortBy?: ExportSort[];
  pagination?: {
    page: number;
    pageSize: number;
  };
  customFileName?: string;
  callbacks?: {
    onProgress?: (progress: ExportProgress) => void;
    onSuccess?: (result: ExportResult) => void;
    onError?: (error: ExportError) => void;
  };
}
```

### ExportProgress

```typescript
interface ExportProgress {
  exportId: string;
  status: ExportStatus;
  progress: number;
  processedRows: number;
  totalRows: number;
  startTime: Date;
  estimatedEndTime?: Date;
  currentData?: any;
  error?: string;
}
```

### ExportResult

```typescript
interface ExportResult {
  exportId: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  fileBlob?: Blob;
  exportedRows: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  statistics?: {
    totalRows: number;
    filteredRows: number;
    exportedRows: number;
    skippedRows: number;
  };
}
```

## React 组件示例

```typescript
import React, { useState } from 'react';
import { universalExportClient, ExportProgress } from '@qhr123/sa2kit/universalExport';

function DataExporter({ data }: { data: any[] }) {
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    setExporting(true);
    try {
      await universalExportClient.exportData({
        configId: 'my-export',
        dataSource: async () => data,
        format,
        callbacks: {
          onProgress: (p) => setProgress(p),
          onSuccess: (result) => {
            // 下载文件
            if (result.fileBlob) {
              const url = URL.createObjectURL(result.fileBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = result.fileName;
              a.click();
              URL.revokeObjectURL(url);
            }
            alert('导出成功！');
          },
          onError: (error) => {
            console.error('导出失败:', error);
            alert('导出失败！');
          },
        },
      });
    } finally {
      setExporting(false);
      setProgress(null);
    }
  };

  return (
    <div>
      <button onClick={() => handleExport('csv')} disabled={exporting}>
        导出为 CSV
      </button>
      <button onClick={() => handleExport('excel')} disabled={exporting}>
        导出为 Excel
      </button>
      <button onClick={() => handleExport('json')} disabled={exporting}>
        导出为 JSON
      </button>

      {progress && (
        <div>
          <p>
            导出进度: {progress.progress}% ({progress.processedRows} /{' '}
            {progress.totalRows})
          </p>
          <progress value={progress.progress} max={100} />
        </div>
      )}
    </div>
  );
}
```

## 最佳实践

1. **配置管理**: 将常用的导出配置保存起来，避免重复创建
2. **进度反馈**: 为大数据量导出提供进度反馈
3. **错误处理**: 妥善处理导出过程中的各种错误
4. **数据验证**: 在导出前验证数据的完整性
5. **文件命名**: 使用有意义的文件名模板
6. **分页导出**: 对于大数据量，考虑分页导出
7. **格式化**: 使用格式化函数确保数据显示正确

## 常见问题

### Q: 支持哪些导出格式？

A: 目前支持 CSV、Excel 和 JSON 格式。

### Q: 如何处理大数据量导出？

A: 建议使用分页功能，每次导出不超过 10000 条记录。可以分批导出后合并。

### Q: 如何自定义字段格式？

A: 使用 `formatter` 函数自定义字段显示格式：

```typescript
{
  key: 'price',
  label: '价格',
  type: 'number',
  formatter: (value) => `¥${value.toFixed(2)}`
}
```

### Q: 如何导出 Excel 文件？

A: 将 `format` 设置为 `'excel'` 即可：

```typescript
await universalExportClient.exportData({
  configId: config,
  dataSource: data,
  format: 'excel',
});
```

### Q: 如何处理中文乱码问题？

A: 确保设置正确的编码和 BOM：

```typescript
{
  encoding: 'utf-8',
  addBOM: true  // 添加 BOM 头，Excel 可以正确识别 UTF-8
}
```

### Q: 如何实现自定义分组逻辑？

A: 使用 `customProcessor` 函数：

```typescript
{
  grouping: {
    enabled: true,
    fields: [{
      key: 'category',
      valueProcessing: 'custom',
      customProcessor: (values) => {
        // 自定义分组逻辑
        return values.reduce((sum, v) => sum + v, 0);
      }
    }]
  }
}
```

