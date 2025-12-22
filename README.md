# SA2Kit

一个现代的、类型安全的 React 工具库，具有跨平台支持，用于构建可扩展的应用程序。

## 特性

- 🚀 **现代 TypeScript** - 完整的类型安全和 IntelliSense 支持
- 📦 **Tree-shakeable** - 使用 ESM 支持优化包大小
- 🔄 **跨平台** - 适用于浏览器和 Node.js 环境
- ⚡ **零依赖** - 极小的体积（React 作为 peer dependency）
- 🧩 **模块化** - 仅导入你需要的部分
- 🎯 **React Hooks** - 常用模式的自定义 Hook
- 📝 **日志系统** - 统一的日志记录，支持多个适配器
- 💾 **存储适配器** - 通用存储抽象
- 📁 **文件上传** - 完整的文件管理，支持进度追踪
- 📊 **数据导出** - 灵活导出为 CSV、Excel、JSON 格式
- 🌍 **i18n** - 完整的国际化解决方案
- 📈 **数据分析** - 全面的事件跟踪和分析

## 安装

```bash
npm install @qhr123/sa2kit
# 或
yarn add @qhr123/sa2kit
# 或
pnpm add @qhr123/sa2kit
```

## 快速开始

### 日志 (Logger)

```typescript
import { logger, createLogger, LogLevel } from '@qhr123/sa2kit/logger';

// 使用默认日志记录器
logger.info('应用程序已启动');
logger.debug('调试信息', { user: 'John' });
logger.error('发生错误', new Error('错误详情'));

// 创建带有上下文的自定义日志记录器
const apiLogger = createLogger('API', {
  minLevel: LogLevel.INFO,
  enableTimestamp: true,
});

apiLogger.info('API 请求已完成');
```

### 工具函数 (Utility Functions)

```typescript
import { stringUtils, arrayUtils, fileUtils } from '@qhr123/sa2kit/utils';

// 字符串工具
const capitalized = stringUtils.capitalize('hello world');
const truncated = stringUtils.truncate('这是一段很长的文本...', 10);

// 数组工具
const unique = arrayUtils.unique([1, 2, 2, 3, 3, 4]);
const grouped = arrayUtils.groupBy(items, 'category');

// 文件工具
const size = fileUtils.formatFileSize(1024000);
const isValid = fileUtils.isValidFilename('document.pdf');
```

### React Hooks

```typescript
import { useLocalStorage, useAsyncStorage } from '@qhr123/sa2kit/hooks';

function MyComponent() {
  // 使用 localStorage 进行持久化状态管理
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  // 异步存储操作
  const { data, loading, error } = useAsyncStorage('user-data');

  return <div>当前主题: {theme}</div>;
}
```

### 文件上传 (File Upload)

```typescript
import { universalFileClient } from '@qhr123/sa2kit/universalFile';

// 上传文件并追踪进度
const uploadFile = async (file: File) => {
  const fileMetadata = await universalFileClient.uploadFile(
    {
      file,
      moduleId: 'user-avatars',
      businessId: 'user-123',
      permission: 'public',
    },
    (progress) => {
      console.log(`上传进度: ${progress.progress}%`);
      console.log(`上传速度: ${progress.speed} 字节/秒`);
    }
  );

  console.log('文件已上传，ID:', fileMetadata.id);
  return fileMetadata;
};

// 查询文件
const files = await universalFileClient.queryFiles({
  moduleId: 'user-avatars',
  pageSize: 20,
});

// 获取文件 URL
const fileUrl = await universalFileClient.getFileUrl(fileId);
```

### 数据导出 (Data Export)

```typescript
import { universalExportClient } from '@qhr123/sa2kit/universalExport';

// 导出数据为 CSV
const exportData = async () => {
  const result = await universalExportClient.exportData({
    configId: 'my-export-config',
    dataSource: async () => [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' },
    ],
    format: 'csv',
    callbacks: {
      onProgress: (progress) => {
        console.log(`导出进度: ${progress.progress}%`);
      },
      onSuccess: (result) => {
        console.log('导出完成:', result.fileName);
        // 下载文件
        const url = URL.createObjectURL(result.fileBlob!);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        a.click();
      },
    },
  });
};
```

### 国际化 (i18n)

```typescript
import { createI18n, useTranslation } from '@qhr123/sa2kit/i18n';
import { zhCN, enUS } from '@qhr123/sa2kit/i18n';

// 创建 i18n 实例
const i18n = createI18n({
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  resources: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});

// 在 React 组件中使用
function MyComponent() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div>
      <p>{t('common.welcome')}</p>
      <button onClick={() => setLocale('en-US')}>
        切换为英文
      </button>
    </div>
  );
}
```

#### UI 组件 (Tailwind CSS)

```typescript
import { LanguageSwitcher } from '@qhr123/sa2kit/i18n';

// 按钮组样式 (默认)
<LanguageSwitcher variant="buttons" />

// 下拉菜单样式
<LanguageSwitcher variant="dropdown" />

// 带有下拉菜单的图标按钮
<LanguageSwitcher variant="icon" />

// 带有自定义类名和回调
<LanguageSwitcher
  variant="buttons"
  className="my-custom-class"
  onLanguageChange={(locale) => {
    console.log('语言已切换为:', locale);
  }}
/>
```

**要求：**
- ✅ React >= 18.0.0
- ✅ 项目中已配置 Tailwind CSS ([设置指南](./docs/tailwind-setup.md))
- ✅ 兼容 Next.js App Router (已包含 'use client')

**注意：** UI 组件使用 Tailwind CSS。请参阅 [Tailwind 设置指南](./docs/tailwind-setup.md) 获取配置说明。

### 数据分析 (Analytics)

```typescript
import { Analytics, createAnalytics } from '@qhr123/sa2kit/analytics';

// 创建分析实例 (需要提供适配器)
const analytics = createAnalytics('my-app', {
  appId: 'my-app',
  appVersion: '1.0.0',
  endpoint: '/api/analytics/events',
  platform: 'web',
  adapter: yourPlatformAdapter, // 需要自行实现
});

// 追踪事件
analytics.trackEvent('button_click', {
  button_id: 'submit',
  page: 'home',
});

// 使用装饰器 (TypeScript)
class MyService {
  @Track('user_login')
  async login(username: string) {
    // 登录逻辑
  }

  @CatchError()
  async fetchData() {
    // 获取数据逻辑
  }
}

// 使用 React Hooks
function MyComponent() {
  const trackEvent = useAnalyticsEvent(analytics);

  usePageView(analytics); // 自动追踪页面访问

  const handleClick = () => {
    trackEvent('button_click', { action: 'submit' });
  };

  return <button onClick={handleClick}>提交</button>;
}
```

## 文档

- [Tailwind CSS 设置](./docs/tailwind-setup.md) - **UI 组件配置**
- [日志文档](./docs/logger.md)
- [工具函数文档](./docs/utils.md)
- [React Hooks 文档](./docs/hooks.md)
- [存储适配器文档](./docs/storage.md)
- [文件上传服务文档](./docs/universalFile.md)
- [OSS 管理模块文档](./docs/ossManager.md) - **阿里云 OSS 管理界面**
- [数据导出服务文档](./docs/universalExport.md)
- [i18n 国际化文档](./docs/i18n.md)
- [数据分析追踪文档](./docs/analytics.md)

## 示例

查看 [examples](./examples) 目录以获取完整的运行示例：

- React 应用示例
- Next.js 集成
- TypeScript 配置

## API 参考

完整的 API 文档可在 [https://react-utils-kit.dev](https://react-utils-kit.dev) 找到

## 贡献

我们欢迎贡献！详情请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

MIT © [Your Name](LICENSE)

## 支持

- 🐛 [报告错误](https://github.com/your-org/react-utils-kit/issues)
- 💡 [请求特性](https://github.com/your-org/react-utils-kit/issues)
- 📖 [文档中心](https://react-utils-kit.dev)
