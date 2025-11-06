# SA2Kit

A modern, type-safe React utility library with cross-platform support for building scalable applications.

## Features

- 🚀 **Modern TypeScript** - Full type safety and IntelliSense support
- 📦 **Tree-shakeable** - Optimized bundle size with ESM support
- 🔄 **Cross-platform** - Works in browser and Node.js environments
- ⚡ **Zero dependencies** - Minimal footprint (React as peer dependency)
- 🧩 **Modular** - Import only what you need
- 🎯 **React Hooks** - Custom hooks for common patterns
- 📝 **Logger System** - Unified logging with multiple adapters
- 💾 **Storage Adapters** - Universal storage abstraction
- 📁 **File Upload** - Complete file management with progress tracking
- 📊 **Data Export** - Flexible export to CSV, Excel, JSON formats
- 🌍 **i18n** - Complete internationalization solution
- 📈 **Analytics** - Comprehensive event tracking and analytics

## Installation

```bash
npm install @qhr123/sa2kit
# or
yarn add @qhr123/sa2kit
# or
pnpm add @qhr123/sa2kit
```

## Quick Start

### Logger

```typescript
import { logger, createLogger, LogLevel } from '@qhr123/sa2kit/logger';

// Use default logger
logger.info('Application started');
logger.debug('Debug information', { user: 'John' });
logger.error('Something went wrong', new Error('Error details'));

// Create custom logger with context
const apiLogger = createLogger('API', {
  minLevel: LogLevel.INFO,
  enableTimestamp: true,
});

apiLogger.info('API request completed');
```

### Utility Functions

```typescript
import { stringUtils, arrayUtils, fileUtils } from '@qhr123/sa2kit/utils';

// String utilities
const capitalized = stringUtils.capitalize('hello world');
const truncated = stringUtils.truncate('Long text...', 10);

// Array utilities
const unique = arrayUtils.unique([1, 2, 2, 3, 3, 4]);
const grouped = arrayUtils.groupBy(items, 'category');

// File utilities
const size = fileUtils.formatFileSize(1024000);
const isValid = fileUtils.isValidFilename('document.pdf');
```

### React Hooks

```typescript
import { useLocalStorage, useAsyncStorage } from '@qhr123/sa2kit/hooks';

function MyComponent() {
  // Persistent state with localStorage
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  // Async storage operations
  const { data, loading, error } = useAsyncStorage('user-data');

  return <div>Theme: {theme}</div>;
}
```

### File Upload

```typescript
import { universalFileClient } from '@qhr123/sa2kit/universalFile';

// Upload a file with progress tracking
const uploadFile = async (file: File) => {
  const fileMetadata = await universalFileClient.uploadFile(
    {
      file,
      moduleId: 'user-avatars',
      businessId: 'user-123',
      permission: 'public',
    },
    (progress) => {
      console.log(`Upload progress: ${progress.progress}%`);
      console.log(`Speed: ${progress.speed} bytes/sec`);
    }
  );

  console.log('File uploaded:', fileMetadata.id);
  return fileMetadata;
};

// Query files
const files = await universalFileClient.queryFiles({
  moduleId: 'user-avatars',
  pageSize: 20,
});

// Get file URL
const fileUrl = await universalFileClient.getFileUrl(fileId);
```

### Data Export

```typescript
import { universalExportClient } from '@qhr123/sa2kit/universalExport';

// Export data to CSV
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
        console.log(`Export progress: ${progress.progress}%`);
      },
      onSuccess: (result) => {
        console.log('Export completed:', result.fileName);
        // Download the file
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

### Internationalization (i18n)

```typescript
import { createI18n, useTranslation } from '@qhr123/sa2kit/i18n';
import { zhCN, enUS } from '@qhr123/sa2kit/i18n';

// Create i18n instance
const i18n = createI18n({
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  resources: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});

// In React component
function MyComponent() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div>
      <p>{t('common.welcome')}</p>
      <button onClick={() => setLocale('en-US')}>
        Switch to English
      </button>
    </div>
  );
}
```

#### UI Components (Tailwind CSS)

```typescript
import { LanguageSwitcher } from '@qhr123/sa2kit/i18n';

// Button group style (default)
<LanguageSwitcher variant="buttons" />

// Dropdown style
<LanguageSwitcher variant="dropdown" />

// Icon button with dropdown
<LanguageSwitcher variant="icon" />

// With custom className and callback
<LanguageSwitcher
  variant="buttons"
  className="my-custom-class"
  onLanguageChange={(locale) => {
    console.log('Language changed to:', locale);
  }}
/>
```

**Requirements:**
- ✅ React >= 18.0.0
- ✅ Tailwind CSS configured in your project ([Setup Guide](./docs/tailwind-setup.md))
- ✅ Next.js App Router compatible ('use client' included)
```

**Note:** UI components use Tailwind CSS. See the [Tailwind Setup Guide](./docs/tailwind-setup.md) for configuration instructions.

### Analytics

```typescript
import { Analytics, createAnalytics } from '@qhr123/sa2kit/analytics';

// Create analytics instance (需要提供适配器)
const analytics = createAnalytics('my-app', {
  appId: 'my-app',
  appVersion: '1.0.0',
  endpoint: '/api/analytics/events',
  platform: 'web',
  adapter: yourPlatformAdapter, // 需要自行实现
});

// Track events
analytics.trackEvent('button_click', {
  button_id: 'submit',
  page: 'home',
});

// Use decorators (TypeScript)
class MyService {
  @Track('user_login')
  async login(username: string) {
    // Login logic
  }

  @CatchError()
  async fetchData() {
    // Fetch logic
  }
}

// Use React Hooks
function MyComponent() {
  const trackEvent = useAnalyticsEvent(analytics);

  usePageView(analytics); // Auto track page views

  const handleClick = () => {
    trackEvent('button_click', { action: 'submit' });
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

## Documentation

- [Tailwind CSS Setup](./docs/tailwind-setup.md) - **UI Components Configuration**
- [Logger Documentation](./docs/logger.md)
- [Utility Functions](./docs/utils.md)
- [React Hooks](./docs/hooks.md)
- [Storage Adapters](./docs/storage.md)
- [File Upload Service](./docs/universalFile.md)
- [Data Export Service](./docs/universalExport.md)
- [i18n Internationalization](./docs/i18n.md)
- [Analytics Tracking](./docs/analytics.md)

## Examples

Check out the [examples](./examples) directory for complete working examples:

- React App Example
- Next.js Integration
- TypeScript Configuration

## API Reference

Full API documentation is available at [https://react-utils-kit.dev](https://react-utils-kit.dev)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT © [Your Name](LICENSE)

## Support

- 🐛 [Report a bug](https://github.com/your-org/react-utils-kit/issues)
- 💡 [Request a feature](https://github.com/your-org/react-utils-kit/issues)
- 📖 [Documentation](https://react-utils-kit.dev)

