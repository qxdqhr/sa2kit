# 快速开始指南

欢迎使用 **React Utils Kit**！本指南将帮助您快速上手。

## 📦 安装

```bash
npm install @react-utils-kit/core
# 或
yarn add @react-utils-kit/core
# 或
pnpm add @react-utils-kit/core
```

## 🚀 5分钟快速体验

### 1. Logger (日志系统)

```typescript
import { logger, createLogger, LogLevel } from '@react-utils-kit/core/logger';

// 使用默认 logger
logger.info('应用启动');
logger.debug('调试信息', { userId: 123 });
logger.warn('这是一个警告');
logger.error('发生错误', new Error('详细信息'));

// 为模块创建专用 logger
const apiLogger = createLogger('API');
apiLogger.info('请求完成');
```

### 2. String Utils (字符串工具)

```typescript
import { stringUtils } from '@react-utils-kit/core/utils';

// 截断长文本
const short = stringUtils.truncate('这是一段很长的文本...', 10);
// "这是一段很长..."

// 首字母大写
const name = stringUtils.capitalize('john doe');
// "John doe"

// 命名转换
stringUtils.camelToSnake('helloWorld');  // "hello_world"
stringUtils.snakeToCamel('hello_world'); // "helloWorld"

// 生成随机字符串
const random = stringUtils.generateRandom(10);
// "aBc123XyZ9"
```

### 3. Array Utils (数组工具)

```typescript
import { arrayUtils } from '@react-utils-kit/core/utils';

// 数组去重
const unique = arrayUtils.unique([1, 2, 2, 3, 3]);
// [1, 2, 3]

// 数组分组
const items = [
  { category: 'fruit', name: 'apple' },
  { category: 'fruit', name: 'banana' },
  { category: 'vegetable', name: 'carrot' },
];
const grouped = arrayUtils.groupBy(items, 'category');
// { fruit: [...], vegetable: [...] }

// 数组分页
const paginated = arrayUtils.paginate([1,2,3,4,5,6,7,8,9,10], 1, 3);
// { data: [1,2,3], total: 10, page: 1, pages: 4, hasNext: true, hasPrev: false }
```

### 4. Validators (验证器)

```typescript
import { validators } from '@react-utils-kit/core/utils';

// 邮箱验证
validators.isValidEmail('user@example.com'); // true

// 密码强度验证
const result = validators.isValidPassword('Abc123');
// { isValid: true, errors: [] }

// 用户名验证
validators.isValidUsername('john_doe'); // true

// URL 验证
validators.isValidUrl('https://example.com'); // true
```

### 5. useLocalStorage Hook

```typescript
import { useLocalStorage } from '@react-utils-kit/core/hooks';

function ThemeToggle() {
  const [theme, setTheme, removeTheme, loading] = useLocalStorage('theme', 'light');

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p>当前主题: {theme}</p>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        切换主题
      </button>
      <button onClick={removeTheme}>
        重置
      </button>
    </div>
  );
}
```

## 📖 完整示例

### 用户认证表单

```typescript
import React, { useState } from 'react';
import {
  validators,
  errorUtils,
  stringUtils,
  createLogger,
  useLocalStorage,
} from '@react-utils-kit/core';

const authLogger = createLogger('Auth');

function LoginForm() {
  const [user, setUser] = useLocalStorage('user', null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    // 验证输入
    if (!validators.isValidUsername(username)) {
      setErrors(['无效的用户名格式']);
      authLogger.warn('用户名验证失败', { username });
      return;
    }

    if (!validators.isValidEmail(email)) {
      setErrors(['无效的邮箱格式']);
      authLogger.warn('邮箱验证失败', { email });
      return;
    }

    try {
      // 使用重试机制调用 API
      const userData = await errorUtils.retry(
        async () => {
          authLogger.info('尝试登录', { username });
          // 模拟 API 调用
          return { id: 1, username, email };
        },
        3,
        1000
      );

      authLogger.info('登录成功', { userId: userData.id });
      setUser(userData);
    } catch (error) {
      const message = errorUtils.extractErrorMessage(error);
      setErrors([message]);
      authLogger.error('登录失败', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="用户名"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
      />
      {errors.length > 0 && (
        <div style={{ color: 'red' }}>
          {errors.map((error, i) => <p key={i}>{error}</p>)}
        </div>
      )}
      <button type="submit">登录</button>
    </form>
  );
}
```

## 🎯 按需导入

React Utils Kit 支持 tree-shaking，您可以只导入需要的功能：

```typescript
// 只导入 logger
import { logger } from '@react-utils-kit/core/logger';

// 只导入特定工具
import { stringUtils, arrayUtils } from '@react-utils-kit/core/utils';

// 只导入 hooks
import { useLocalStorage } from '@react-utils-kit/core/hooks';
```

## 📚 深入学习

- **完整 API 文档**: 查看 `docs/` 目录
  - [Logger API](./docs/logger.md)
  - [Utils API](./docs/utils.md)
  - [Hooks API](./docs/hooks.md)

- **更多示例**: 查看 `examples/` 目录
  - [基础用法](./examples/basic-usage.tsx)
  - [完整应用](./examples/react-app-example.tsx)

## 💡 最佳实践

1. **为每个模块创建独立的 logger**
   ```typescript
   const dbLogger = createLogger('Database');
   const apiLogger = createLogger('API');
   ```

2. **使用 TypeScript 获得完整类型支持**
   ```typescript
   const [user, setUser] = useLocalStorage<User>('user', null);
   ```

3. **组合使用工具函数**
   ```typescript
   const processData = (items: Item[]) => {
     const unique = arrayUtils.unique(items);
     const grouped = arrayUtils.groupBy(unique, 'category');
     return grouped;
   };
   ```

## 🆘 需要帮助？

- 查看 [完整文档](./docs/)
- 查看 [示例代码](./examples/)
- 提交 [Issue](https://github.com/your-org/react-utils-kit/issues)
- 查看 [FAQ](./CONTRIBUTING.md)

## 🚀 下一步

- 探索所有可用的工具函数
- 尝试在您的项目中集成
- 查看高级用法和配置选项
- 为项目做出贡献

---

**开始构建精彩的应用吧！** 🎉

