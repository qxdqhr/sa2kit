# 测测你是什么 - 快速入门指南

## 🎯 新功能概览

TestYourself 模块现已支持完整的多配置管理功能：

✅ **多套配置支持** - 通过 query 参数轻松切换不同主题的测试
✅ **可视化后台管理** - 完整的配置管理界面，支持创建、编辑、删除
✅ **图片上传** - 支持 Base64、服务器上传、通用上传组件
✅ **导入导出** - 方便配置备份和迁移
✅ **配置列表** - 展示和选择配置的列表组件
✅ **灵活存储** - 支持 localStorage、内存、自定义存储适配器

## 📁 新增文件结构

```
src/testYourself/
├── components/
│   └── TestYourself.tsx          # 主组件（已更新，支持 configId）
├── admin/                         # 🆕 管理后台组件
│   ├── ConfigManager.tsx          # 配置管理组件
│   ├── ConfigList.tsx             # 配置列表组件
│   └── index.ts
├── server/                        # 🆕 服务端逻辑
│   ├── ConfigService.ts           # 配置管理服务
│   └── index.ts
├── types.ts                       # 类型定义（已更新）
├── ADMIN_GUIDE.md                 # 🆕 详细使用指南
├── QUICK_START.md                 # 🆕 快速入门指南
└── README.md                      # 已更新

examples/app/
├── test-yourself/
│   └── page.tsx                   # 测试页面（已更新，支持 query 参数）
└── test-yourself-admin/           # 🆕 配置管理示例页面
    └── page.tsx
```

## 🚀 快速开始

### 1. 基础使用（原有功能）

```tsx
import { TestYourself } from 'sa2kit/testYourself';

function App() {
  return <TestYourself />;
}
```

### 2. 使用配置管理后台

```tsx
import { ConfigManager, createConfigService } from 'sa2kit/testYourself';

const configService = createConfigService();

function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <ConfigManager configService={configService} />
    </div>
  );
}
```

### 3. 使用 Query 参数加载配置

```tsx
'use client';
import { TestYourself } from 'sa2kit/testYourself';
import { useSearchParams } from 'next/navigation';

function TestPage() {
  const searchParams = useSearchParams();
  const configId = searchParams.get('configId');

  return <TestYourself configId={configId || undefined} />;
}
```

访问方式：
- `/test-yourself` - 使用默认配置
- `/test-yourself?configId=config_12345` - 使用指定配置

### 4. 配置列表展示

```tsx
import { ConfigList, createConfigService } from 'sa2kit/testYourself';

const configService = createConfigService();

function SelectPage() {
  return (
    <ConfigList
      configService={configService}
      onSelect={(id) => {
        window.location.href = `/test-yourself?configId=${id}`;
      }}
      showPreviewLink={true}
    />
  );
}
```

## 🔥 典型使用场景

### 场景1: 多主题测试网站

创建不同主题的测试配置（动物、植物、星座等），用户可以选择不同主题进行测试。

```tsx
// 1. 在后台创建多个配置
// 访问 /test-yourself-admin

// 2. 创建主题选择页面
function ThemeSelectPage() {
  return (
    <div>
      <h1>选择你的测试主题</h1>
      <ConfigList
        configService={configService}
        onSelect={(id) => router.push(`/test?configId=${id}`)}
      />
    </div>
  );
}

// 3. 测试页面自动加载对应配置
function TestPage() {
  const configId = useSearchParams().get('configId');
  return <TestYourself configId={configId} />;
}
```

### 场景2: A/B 测试

创建不同版本的配置进行 A/B 测试。

```tsx
// 创建两个版本
const versionA = await configService.createConfig('版本A', configA);
const versionB = await configService.createConfig('版本B', configB);

// 随机分配
const configId = Math.random() > 0.5 ? versionA.id : versionB.id;
return <TestYourself configId={configId} />;
```

### 场景3: 品牌定制

为不同的客户或品牌创建定制化配置。

```tsx
// 品牌A的配置
const brandAConfig = await configService.createConfig(
  '品牌A专属',
  {
    gameTitle: '测测你是品牌A的什么产品',
    results: [/* 品牌A的产品列表 */],
  }
);

// 品牌B的配置
const brandBConfig = await configService.createConfig(
  '品牌B专属',
  {
    gameTitle: '测测你是品牌B的什么系列',
    results: [/* 品牌B的系列列表 */],
  }
);
```

## 📚 核心 API

### ConfigService

配置管理服务，提供完整的 CRUD 操作。

```tsx
import { ConfigService, createConfigService } from 'sa2kit/testYourself';

// 创建服务实例
const service = createConfigService({
  storageType: 'localStorage', // 或 'memory'
  enableCache: true,
});

// 创建配置
const config = await service.createConfig(name, testConfig, description);

// 获取配置
const config = await service.getConfig(id);
const allConfigs = await service.getAllConfigs();
const defaultConfig = await service.getDefaultConfig();

// 更新配置
await service.updateConfig(id, updates);

// 删除配置
await service.deleteConfig(id);

// 导出/导入
const json = await service.exportConfig(id);
const imported = await service.importConfig(json);

// 复制配置
const duplicated = await service.duplicateConfig(id, newName);
```

### TestYourself 组件（新增 Props）

```tsx
interface TestYourselfProps {
  /** 配置对象（直接传入配置） */
  config?: TestConfig;
  
  /** 配置ID（通过 query 参数指定）🆕 */
  configId?: string;
  
  /** 结果回调 */
  onResult?: (result: TestResult) => void;
  
  /** 自定义样式类名 */
  className?: string;
}
```

## 🎨 图片上传集成

### 方式1: Base64（默认）

```tsx
<ConfigManager configService={configService} />
// 不提供 onImageUpload，自动使用 Base64
```

### 方式2: 服务器上传

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
    return data.url;
  }}
/>
```

### 方式3: sa2kit 通用上传组件

```tsx
import { UniversalFileService } from 'sa2kit/universalFile';

const fileService = new UniversalFileService({
  provider: 'local',
  config: { uploadDir: './uploads' },
});

<ConfigManager
  configService={configService}
  onImageUpload={async (file) => {
    const result = await fileService.uploadFile({
      file,
      filename: file.name,
      moduleId: 'test-yourself',
    });
    return result.url;
  }}
/>
```

## 🔧 自定义存储

如需将配置保存到数据库或远程服务器，可实现自定义存储适配器：

```tsx
import { IConfigStorage, ConfigService } from 'sa2kit/testYourself';

class DatabaseStorage implements IConfigStorage {
  async saveConfig(config: SavedConfig): Promise<void> {
    await fetch('/api/configs', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }
  
  // 实现其他方法...
}

const service = new ConfigService({
  customStorage: new DatabaseStorage(),
});
```

## 📖 更多文档

- **详细使用指南**: `ADMIN_GUIDE.md`
- **完整功能介绍**: `README.md`
- **API 文档**: 查看类型定义 `types.ts`

## 💡 示例页面

在 examples 目录中提供了完整的示例：

1. **测试页面**: `examples/app/test-yourself/page.tsx`
   - 支持 query 参数加载不同配置
   - 展示如何集成到 Next.js 应用

2. **管理后台**: `examples/app/test-yourself-admin/page.tsx`
   - 完整的配置管理界面
   - 配置列表展示
   - 使用说明和代码示例

## 🎯 下一步

1. **运行示例**: 访问 `/test-yourself-admin` 创建你的第一个配置
2. **测试配置**: 访问 `/test-yourself?configId=xxx` 查看效果
3. **阅读文档**: 查看 `ADMIN_GUIDE.md` 了解更多高级用法
4. **自定义存储**: 根据需要实现自定义存储适配器

## ❓ 常见问题

**Q: 如何迁移现有数据？**
A: 使用导出/导入功能，或通过 API 批量创建配置。

**Q: 配置保存在哪里？**
A: 默认保存在 localStorage，可通过自定义存储适配器改为数据库或远程服务器。

**Q: 如何实现多语言？**
A: 为不同语言创建不同的配置，根据用户语言选择对应的 configId。

**Q: 图片建议使用什么格式？**
A: 推荐使用 emoji（体积小、加载快），或使用 CDN 托管的图片 URL。

---

**开始使用，让你的测试游戏更加灵活和强大！** 🚀

