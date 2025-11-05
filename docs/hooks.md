# React Hooks API 文档

React hooks for common patterns including storage management.

## 安装

```bash
npm install @react-utils-kit/core
```

## Hooks

### useLocalStorage

用于在 React 组件中使用 localStorage 的 hook，提供类型安全和自动同步。

#### API

```typescript
function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void, boolean]
```

**返回值:**
- `[0]` - 当前值
- `[1]` - 更新函数
- `[2]` - 删除函数
- `[3]` - 加载状态

#### 基础使用

```typescript
import { useLocalStorage } from '@react-utils-kit/core/hooks';

function App() {
  const [theme, setTheme, removeTheme, loading] = useLocalStorage('theme', 'light');

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
      <button onClick={removeTheme}>
        Reset Theme
      </button>
    </div>
  );
}
```

#### 复杂对象

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const [user, setUser] = useLocalStorage<User | null>('user', null);

  const login = (userData: User) => {
    setUser(userData);
  };

  return (
    <div>
      {user ? (
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      ) : (
        <button onClick={() => login({ id: 1, name: 'John', email: 'john@example.com' })}>
          Login
        </button>
      )}
    </div>
  );
}
```

#### 跨标签页同步

`useLocalStorage` 自动支持跨标签页同步：

```typescript
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  // 当其他标签页修改主题时，这个组件会自动更新
  return (
    <div style={{ background: theme === 'dark' ? '#000' : '#fff' }}>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  );
}
```

### useStorage

更底层的通用 storage hook，可以与任何 `StorageAdapter` 配合使用。

#### API

```typescript
function useStorage<T>(
  storage: StorageAdapter,
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void, boolean]
```

#### 自定义 Storage

```typescript
import { useStorage } from '@react-utils-kit/core/hooks';
import { WebStorageAdapter } from '@react-utils-kit/core/storage';

// 创建自定义适配器实例
const sessionStorage = new WebStorageAdapter(); // 可以扩展为 SessionStorage

function MyComponent() {
  const [data, setData] = useStorage(
    sessionStorage,
    'my-key',
    { count: 0 }
  );

  return (
    <div>
      <p>Count: {data.count}</p>
      <button onClick={() => setData({ count: data.count + 1 })}>
        Increment
      </button>
    </div>
  );
}
```

## Storage Adapters

### WebStorageAdapter

浏览器 localStorage 适配器，支持 SSR。

```typescript
import { WebStorageAdapter } from '@react-utils-kit/core/storage';

const adapter = new WebStorageAdapter();

// 直接使用
await adapter.setItem('key', 'value');
const value = await adapter.getItem('key');
await adapter.removeItem('key');
await adapter.clear();
```

#### 监听变化

```typescript
const cleanup = adapter.addChangeListener((key, value) => {
  console.log(`${key} changed to ${value}`);
});

// 清理监听器
cleanup();
```

## 完整示例

### 主题切换

```typescript
import { useLocalStorage } from '@react-utils-kit/core/hooks';

type Theme = 'light' | 'dark';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme, , loading] = useLocalStorage<Theme>('app-theme', 'light');

  if (loading) {
    return <div>Loading theme...</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`theme-${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
```

### 用户偏好设置

```typescript
import { useLocalStorage } from '@react-utils-kit/core/hooks';

interface UserPreferences {
  language: string;
  notifications: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

function SettingsPage() {
  const [prefs, setPrefs] = useLocalStorage<UserPreferences>('user-prefs', {
    language: 'en',
    notifications: true,
    fontSize: 'medium',
  });

  const updateLanguage = (language: string) => {
    setPrefs({ ...prefs, language });
  };

  const toggleNotifications = () => {
    setPrefs({ ...prefs, notifications: !prefs.notifications });
  };

  return (
    <div>
      <select value={prefs.language} onChange={(e) => updateLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>

      <label>
        <input
          type="checkbox"
          checked={prefs.notifications}
          onChange={toggleNotifications}
        />
        Enable Notifications
      </label>
    </div>
  );
}
```

### 表单草稿自动保存

```typescript
import { useLocalStorage } from '@react-utils-kit/core/hooks';
import { useEffect } from 'react';

interface FormData {
  title: string;
  content: string;
}

function BlogEditor() {
  const [draft, setDraft, removeDraft] = useLocalStorage<FormData>('blog-draft', {
    title: '',
    content: '',
  });

  const handleSubmit = async () => {
    await saveBlogPost(draft);
    removeDraft(); // 清除草稿
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="Title"
      />
      <textarea
        value={draft.content}
        onChange={(e) => setDraft({ ...draft, content: e.target.value })}
        placeholder="Content"
      />
      <button type="submit">Publish</button>
    </form>
  );
}
```

## TypeScript 支持

所有 hooks 都提供完整的 TypeScript 类型支持：

```typescript
// 自动推断类型
const [count, setCount] = useLocalStorage('count', 0);
// count: number

// 显式类型
const [user, setUser] = useLocalStorage<User | null>('user', null);
// user: User | null

// 复杂类型
interface AppState {
  user: User | null;
  settings: Settings;
  cache: Record<string, any>;
}

const [state, setState] = useLocalStorage<AppState>('app-state', {
  user: null,
  settings: defaultSettings,
  cache: {},
});
```

## 最佳实践

1. **使用有意义的键名**
   ```typescript
   // 好
   useLocalStorage('user-preferences', defaults);

   // 不好
   useLocalStorage('data', defaults);
   ```

2. **提供合适的默认值**
   ```typescript
   const [settings, setSettings] = useLocalStorage('settings', {
     theme: 'light',
     language: 'en',
   });
   ```

3. **处理加载状态**
   ```typescript
   const [data, setData, , loading] = useLocalStorage('data', null);

   if (loading) {
     return <Spinner />;
   }
   ```

4. **清理不需要的数据**
   ```typescript
   const [cache, , removeCache] = useLocalStorage('cache', {});

   useEffect(() => {
     // 清理过期缓存
     if (isExpired(cache)) {
       removeCache();
     }
   }, [cache]);
   ```

