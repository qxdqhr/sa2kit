# 测测你是什么 - 配置管理指南

## 📚 目录

- [快速开始](#快速开始)
- [配置管理后台](#配置管理后台)
- [配置列表组件](#配置列表组件)
- [配置服务 API](#配置服务-api)
- [使用多套配置](#使用多套配置)
- [自定义存储](#自定义存储)
- [最佳实践](#最佳实践)

## 快速开始

### 1. 创建配置管理页面

```tsx
import { ConfigManager, createConfigService } from 'sa2kit/testYourself';

const configService = createConfigService();

function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <ConfigManager
        configService={configService}
        onConfigChange={(configs) => {
          console.log('配置列表已更新:', configs);
        }}
      />
    </div>
  );
}

export default AdminPage;
```

### 2. 创建测试页面（支持多配置）

```tsx
'use client';

import { TestYourself } from 'sa2kit/testYourself';
import { useSearchParams } from 'next/navigation';

function TestPage() {
  const searchParams = useSearchParams();
  const configId = searchParams.get('configId');

  return (
    <TestYourself 
      configId={configId || undefined}
      onResult={(result) => {
        console.log('测试结果:', result);
      }}
    />
  );
}

export default TestPage;
```

访问不同配置：
- `/test-yourself` - 使用默认配置
- `/test-yourself?configId=config_12345` - 使用指定配置

### 3. 创建配置选择页面

```tsx
import { ConfigList, createConfigService } from 'sa2kit/testYourself';
import { useRouter } from 'next/navigation';

const configService = createConfigService();

function SelectConfigPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">选择测试主题</h1>
      <ConfigList
        configService={configService}
        onSelect={(id) => {
          router.push(`/test-yourself?configId=${id}`);
        }}
        showPreviewLink={true}
        previewBaseUrl="/test-yourself"
      />
    </div>
  );
}

export default SelectConfigPage;
```

## 配置管理后台

### ConfigManager 组件属性

```tsx
interface ConfigManagerProps {
  /** 配置服务实例 */
  configService: ConfigService;
  
  /** 配置变化回调 */
  onConfigChange?: (configs: SavedConfig[]) => void;
  
  /** 自定义样式 */
  className?: string;
  
  /** 图片上传处理函数 */
  onImageUpload?: (file: File) => Promise<string>;
}
```

### 图片上传处理

#### 方式1: 使用 Base64（默认）

如果不提供 `onImageUpload`，组件会自动将图片转换为 Base64 格式：

```tsx
<ConfigManager configService={configService} />
```

#### 方式2: 上传到服务器

```tsx
<ConfigManager
  configService={configService}
  onImageUpload={async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return data.url; // 返回图片URL
  }}
/>
```

#### 方式3: 使用 sa2kit 通用上传组件

```tsx
import { UniversalFileService } from 'sa2kit/universalFile';

const fileService = new UniversalFileService({
  provider: 'local', // 或 'aliyun', 's3' 等
  config: {
    uploadDir: './uploads',
  },
});

<ConfigManager
  configService={configService}
  onImageUpload={async (file) => {
    const uploadInfo = {
      file,
      filename: file.name,
      moduleId: 'test-yourself',
      businessId: 'result-images',
    };
    
    const result = await fileService.uploadFile(uploadInfo);
    return result.url;
  }}
/>
```

## 配置列表组件

### ConfigList 组件属性

```tsx
interface ConfigListProps {
  /** 配置服务实例 */
  configService: ConfigService;
  
  /** 选择配置回调 */
  onSelect?: (id: string) => void;
  
  /** 编辑配置回调 */
  onEdit?: (id: string) => void;
  
  /** 删除配置回调 */
  onDelete?: (id: string) => void;
  
  /** 是否显示操作按钮 */
  showActions?: boolean;
  
  /** 是否显示预览链接 */
  showPreviewLink?: boolean;
  
  /** 预览基础URL */
  previewBaseUrl?: string;
  
  /** 自定义样式 */
  className?: string;
  
  /** 每页显示数量 */
  pageSize?: number;
}
```

### 使用示例

```tsx
<ConfigList
  configService={configService}
  onSelect={(id) => console.log('选择:', id)}
  onEdit={(id) => console.log('编辑:', id)}
  onDelete={(id) => console.log('删除:', id)}
  showActions={true}
  showPreviewLink={true}
  previewBaseUrl="/test-yourself"
  pageSize={20}
/>
```

## 配置服务 API

### 创建配置服务

```tsx
import { ConfigService, createConfigService } from 'sa2kit/testYourself';

// 方式1: 使用工厂函数
const service = createConfigService({
  storageType: 'localStorage', // 'localStorage' | 'memory'
  enableCache: true,
});

// 方式2: 直接创建实例
const service = new ConfigService({
  storageType: 'localStorage',
  enableCache: true,
});

// 方式3: 使用默认单例
import { getDefaultConfigService } from 'sa2kit/testYourself';
const service = getDefaultConfigService();
```

### API 方法

#### 创建配置

```tsx
const newConfig = await configService.createConfig(
  '配置名称',
  {
    gameTitle: '测测你是什么',
    gameDescription: '长按按钮，发现你的专属属性',
    buttonText: '长按开始',
    longPressDuration: 2000,
    results: [
      {
        id: '1',
        title: '可爱的猫咪',
        description: '你是一只慵懒优雅的猫咪',
        image: '🐱',
        imageType: 'emoji',
      },
      // ... 更多结果
    ],
  },
  '配置描述（可选）',
  false // 是否设为默认配置
);
```

#### 获取配置

```tsx
// 获取单个配置
const config = await configService.getConfig('config_id');

// 获取所有配置
const allConfigs = await configService.getAllConfigs();

// 获取配置列表（精简版，不包含完整的结果数据）
const configList = await configService.getConfigList();

// 获取默认配置
const defaultConfig = await configService.getDefaultConfig();
```

#### 更新配置

```tsx
await configService.updateConfig('config_id', {
  name: '新名称',
  description: '新描述',
  config: {
    gameTitle: '更新的标题',
    // ... 其他配置
  },
});
```

#### 删除配置

```tsx
// 删除单个配置
await configService.deleteConfig('config_id');

// 批量删除
await configService.deleteConfigs(['id1', 'id2', 'id3']);
```

#### 设置默认配置

```tsx
await configService.setDefaultConfig('config_id');
```

#### 导出/导入配置

```tsx
// 导出配置为 JSON
const jsonString = await configService.exportConfig('config_id');

// 保存到文件
const blob = new Blob([jsonString], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'config.json';
a.click();

// 导入配置
const imported = await configService.importConfig(jsonString);
```

#### 复制配置

```tsx
const duplicated = await configService.duplicateConfig(
  'config_id',
  '新配置名称（可选）'
);
```

#### 清除缓存

```tsx
configService.clearCache();
```

## 使用多套配置

### 场景1: 不同主题的测试

```tsx
// 动物主题配置
const animalConfig = await configService.createConfig(
  '动物主题',
  {
    gameTitle: '测测你是什么动物',
    results: [/* 动物结果 */],
  }
);

// 植物主题配置
const plantConfig = await configService.createConfig(
  '植物主题',
  {
    gameTitle: '测测你是什么植物',
    results: [/* 植物结果 */],
  }
);

// 使用不同配置
<TestYourself configId={animalConfig.id} />
<TestYourself configId={plantConfig.id} />
```

### 场景2: A/B 测试

```tsx
// 创建两个版本的配置
const versionA = await configService.createConfig('版本A', configA);
const versionB = await configService.createConfig('版本B', configB);

// 随机分配配置
const configId = Math.random() > 0.5 ? versionA.id : versionB.id;
<TestYourself configId={configId} />
```

### 场景3: 多语言支持

```tsx
const zhConfig = await configService.createConfig(
  '中文版',
  {
    gameTitle: '测测你是什么',
    results: [/* 中文结果 */],
  }
);

const enConfig = await configService.createConfig(
  'English Version',
  {
    gameTitle: 'What Are You?',
    results: [/* English results */],
  }
);

// 根据语言选择配置
const locale = navigator.language.startsWith('zh') ? 'zh' : 'en';
const configId = locale === 'zh' ? zhConfig.id : enConfig.id;
<TestYourself configId={configId} />
```

## 自定义存储

### 实现数据库存储

```tsx
import { IConfigStorage } from 'sa2kit/testYourself';
import type { SavedConfig } from 'sa2kit/testYourself';

class DatabaseStorageAdapter implements IConfigStorage {
  private apiUrl = '/api/test-configs';

  async saveConfig(config: SavedConfig): Promise<void> {
    await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  }

  async getConfig(id: string): Promise<SavedConfig | null> {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }

  async getAllConfigs(): Promise<SavedConfig[]> {
    const response = await fetch(this.apiUrl);
    return response.json();
  }

  async deleteConfig(id: string): Promise<void> {
    await fetch(`${this.apiUrl}/${id}`, { method: 'DELETE' });
  }

  async updateConfig(id: string, config: SavedConfig): Promise<void> {
    await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  }

  async setDefaultConfig(id: string): Promise<void> {
    await fetch(`${this.apiUrl}/${id}/default`, { method: 'POST' });
  }

  async getDefaultConfig(): Promise<SavedConfig | null> {
    try {
      const response = await fetch(`${this.apiUrl}/default`);
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }
}

// 使用
const configService = new ConfigService({
  customStorage: new DatabaseStorageAdapter(),
});
```

### 后端 API 示例 (Next.js)

```tsx
// app/api/test-configs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 假设使用 Prisma

// GET /api/test-configs - 获取所有配置
export async function GET() {
  const configs = await prisma.testConfig.findMany();
  return NextResponse.json(configs);
}

// POST /api/test-configs - 创建配置
export async function POST(request: NextRequest) {
  const body = await request.json();
  const config = await prisma.testConfig.create({
    data: body,
  });
  return NextResponse.json(config);
}

// app/api/test-configs/[id]/route.ts

// GET /api/test-configs/:id - 获取单个配置
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const config = await prisma.testConfig.findUnique({
    where: { id: params.id },
  });
  
  if (!config) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  return NextResponse.json(config);
}

// PUT /api/test-configs/:id - 更新配置
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const config = await prisma.testConfig.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(config);
}

// DELETE /api/test-configs/:id - 删除配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.testConfig.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ success: true });
}
```

## 最佳实践

### 1. 配置命名规范

```tsx
// 好的命名
await configService.createConfig(
  '动物主题测试 - 2024版',
  config,
  '包含45种动物结果，适合儿童使用'
);

// 不好的命名
await configService.createConfig('test1', config);
```

### 2. 结果数据管理

```tsx
// 推荐：使用有意义的 ID
const results = [
  {
    id: 'animal_cat',
    title: '可爱的猫咪',
    // ...
  },
  {
    id: 'animal_dog',
    title: '忠诚的狗狗',
    // ...
  },
];

// 不推荐：使用随机 ID
const results = [
  {
    id: '1',
    title: '结果1',
    // ...
  },
];
```

### 3. 图片管理

```tsx
// 推荐：使用 emoji（体积小，加载快）
{
  image: '🐱',
  imageType: 'emoji',
}

// 图片 URL：使用 CDN
{
  image: 'https://cdn.example.com/cat.jpg',
  imageType: 'url',
}

// Base64：仅用于小图片（< 50KB）
{
  image: 'data:image/png;base64,...',
  imageType: 'url',
}
```

### 4. 配置版本管理

```tsx
// 使用描述记录版本信息
await configService.createConfig(
  '动物主题测试',
  config,
  'v2.0 - 2024-12-17 - 新增10种动物，优化描述文案'
);
```

### 5. 错误处理

```tsx
try {
  const config = await configService.getConfig(configId);
  if (!config) {
    // 使用默认配置
    const defaultConfig = await configService.getDefaultConfig();
    // ...
  }
} catch (error) {
  console.error('加载配置失败:', error);
  // 显示错误提示或使用内置默认配置
}
```

### 6. 性能优化

```tsx
// 启用缓存
const configService = new ConfigService({
  enableCache: true,
});

// 仅加载必要的数据
const configList = await configService.getConfigList(); // 精简版
// 而不是
const allConfigs = await configService.getAllConfigs(); // 完整数据
```

### 7. 安全性

```tsx
// 在管理后台添加权限检查
function AdminPage() {
  const { user } = useAuth();
  
  if (!user?.isAdmin) {
    return <div>无权访问</div>;
  }
  
  return <ConfigManager configService={configService} />;
}
```

## 常见问题

### Q: 如何迁移现有配置？

```tsx
// 1. 导出现有配置
const oldConfigJson = await oldService.exportConfig('old_id');

// 2. 导入到新服务
const newConfig = await newService.importConfig(oldConfigJson);
```

### Q: 如何批量创建配置？

```tsx
const configs = [
  { name: '配置1', config: config1 },
  { name: '配置2', config: config2 },
];

for (const { name, config } of configs) {
  await configService.createConfig(name, config);
}
```

### Q: 如何实现配置预览？

```tsx
<ConfigList
  configService={configService}
  onSelect={(id) => {
    // 在新窗口打开预览
    window.open(`/test-yourself?configId=${id}`, '_blank');
  }}
  showPreviewLink={true}
/>
```

### Q: 如何备份所有配置？

```tsx
async function backupAllConfigs() {
  const configs = await configService.getAllConfigs();
  const backup = JSON.stringify(configs, null, 2);
  
  // 下载备份文件
  const blob = new Blob([backup], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

## 总结

TestYourself 模块现在提供了完整的配置管理功能：

✅ **多套配置支持** - 通过 query 参数轻松切换不同配置
✅ **可视化管理** - 完整的后台管理界面
✅ **灵活存储** - 支持 localStorage、内存、自定义存储
✅ **图片上传** - 支持 Base64、服务器上传、通用上传组件
✅ **导入导出** - 方便配置备份和迁移
✅ **类型安全** - 完整的 TypeScript 类型定义

开始使用，让你的测试游戏更加灵活和强大！



