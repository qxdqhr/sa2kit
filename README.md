# React Utils Kit

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

## Installation

```bash
npm install @react-utils-kit/core
# or
yarn add @react-utils-kit/core
# or
pnpm add @react-utils-kit/core
```

## Quick Start

### Logger

```typescript
import { logger, createLogger, LogLevel } from '@react-utils-kit/core/logger';

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
import { stringUtils, arrayUtils, fileUtils } from '@react-utils-kit/core/utils';

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
import { useLocalStorage, useAsyncStorage } from '@react-utils-kit/core/hooks';

function MyComponent() {
  // Persistent state with localStorage
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  // Async storage operations
  const { data, loading, error } = useAsyncStorage('user-data');

  return <div>Theme: {theme}</div>;
}
```

## Documentation

- [Logger Documentation](./docs/logger.md)
- [Utility Functions](./docs/utils.md)
- [React Hooks](./docs/hooks.md)
- [Storage Adapters](./docs/storage.md)

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

