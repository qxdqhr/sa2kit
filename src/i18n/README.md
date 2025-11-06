# LyricNote i18n 国际化库

轻量级、类型安全的国际化解决方案，支持 Web、React
Native、Taro 小程序、Electron 等多平台。

## 特性

- ✅ **零依赖**：核心功能无外部依赖
- ✅ **类型安全**：完整的 TypeScript 类型定义
- ✅ **轻量级**：核心代码 < 5KB
- ✅ **跨平台**：支持 Web、React Native、Taro、Electron
- ✅ **插值支持**：`{{variable}}` 格式的变量替换
- ✅ **嵌套键**：支持 `user.name` 这样的路径
- ✅ **复数处理**：`_one` 和 `_other` 后缀
- ✅ **Fallback**：自动回退到默认语言
- ✅ **React Hooks**：`useTranslation()` 和 `useLocale()`

## 快速开始

### 1. 初始化 i18n

```typescript
import { initI18n, zhCN, enUS } from '@lyricnote/shared';

// 初始化
initI18n({
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  resources: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});
```

### 2. 在 React 组件中使用

```tsx
import { useTranslation } from '@lyricnote/shared';

function MyComponent() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('user.login')}</p>

      {/* 切换语言 */}
      <button onClick={() => setLocale('en-US')}>English</button>
      <button onClick={() => setLocale('zh-CN')}>中文</button>
    </div>
  );
}
```

### 3. 在普通函数中使用

```typescript
import { t } from '@lyricnote/shared';

function showMessage() {
  console.log(t('common.hello'));
}
```

## 高级用法

### 插值（变量替换）

```typescript
// 翻译文件
{
  greeting: "你好，{{name}}！",
  welcome_back: "欢迎回来，{{name}}。你有 {{count}} 条消息。"
}

// 使用
t('greeting', { context: { name: '张三' } })
// => "你好，张三！"

t('welcome_back', { context: { name: '张三', count: 5 } })
// => "欢迎回来，张三。你有 5 条消息。"
```

### 复数处理

```typescript
// 翻译文件
{
  "items": "{{count}} 个项目",
  "items_one": "{{count}} 个项目",
  "items_other": "{{count}} 个项目"
}

// 使用
t('items', { count: 1 })  // => "1 个项目"
t('items', { count: 5 })  // => "5 个项目"
```

### 嵌套键

```typescript
// 翻译文件
{
  user: {
    profile: {
      name: "姓名",
      email: "邮箱"
    }
  }
}

// 使用
t('user.profile.name')   // => "姓名"
t('user.profile.email')  // => "邮箱"
```

### 默认值

```typescript
t('not.exist.key', { defaultValue: '默认值' });
// => "默认值"
```

### 动态添加翻译

```typescript
import { getI18n } from '@lyricnote/shared';

const i18n = getI18n();

// 添加新的翻译资源
i18n.addResources('zh-CN', {
  custom: {
    message: '自定义消息',
  },
});

t('custom.message'); // => "自定义消息"
```

## 平台适配

### Web

```typescript
import { initI18n, WebI18nAdapter, zhCN, enUS } from '@lyricnote/shared';

const adapter = new WebI18nAdapter();

// 获取系统语言
const systemLocale = adapter.getSystemLocale();

// 加载保存的语言
const savedLocale = await adapter.loadLocale();

// 初始化
initI18n({
  locale: savedLocale || systemLocale,
  fallbackLocale: 'zh-CN',
  resources: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});

// 保存语言选择
await adapter.saveLocale('en-US');
```

### React Native

```typescript
import {
  initI18n,
  ReactNativeI18nAdapter,
  zhCN,
  enUS,
} from '@lyricnote/shared';

const adapter = new ReactNativeI18nAdapter();

// 获取系统语言
const systemLocale = adapter.getSystemLocale();

// 加载保存的语言
const savedLocale = await adapter.loadLocale();

// 初始化
initI18n({
  locale: savedLocale || systemLocale,
  fallbackLocale: 'zh-CN',
  resources: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});
```

### Taro (小程序)

```typescript
import { initI18n, TaroI18nAdapter, zhCN, enUS } from '@lyricnote/shared';

const adapter = new TaroI18nAdapter();

// 获取系统语言
const systemLocale = adapter.getSystemLocale();

// 加载保存的语言
const savedLocale = await adapter.loadLocale();

// 初始化
initI18n({
  locale: savedLocale || systemLocale,
  fallbackLocale: 'zh-CN',
  resources: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});
```

### Electron

```typescript
import { initI18n, ElectronI18nAdapter, zhCN, enUS } from '@lyricnote/shared';

const adapter = new ElectronI18nAdapter();

// 获取系统语言
const systemLocale = adapter.getSystemLocale();

// 加载保存的语言
const savedLocale = await adapter.loadLocale();

// 初始化
initI18n({
  locale: savedLocale || systemLocale,
  fallbackLocale: 'zh-CN',
  resources: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});
```

## 添加新语言

### 1. 创建翻译文件

```typescript
// packages/shared/src/i18n/locales/ja-JP.ts
export default {
  common: {
    hello: 'こんにちは',
    welcome: 'ようこそ',
    // ...
  },
  // ...
} as const;
```

### 2. 导出翻译

```typescript
// packages/shared/src/i18n/index.ts
export { default as jaJP } from './locales/ja-JP';
```

### 3. 更新类型

```typescript
// packages/shared/src/i18n/types.ts
export type Locale = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP';
```

### 4. 使用新语言

```typescript
import { initI18n, zhCN, enUS, jaJP } from '@lyricnote/shared';

initI18n({
  locale: 'ja-JP',
  fallbackLocale: 'zh-CN',
  resources: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'ja-JP': jaJP,
  },
});
```

## 最佳实践

### 1. 翻译文件组织

按模块组织翻译：

```typescript
export default {
  // 通用
  common: {
    /* ... */
  },

  // 按功能模块
  auth: {
    /* ... */
  },
  profile: {
    /* ... */
  },
  settings: {
    /* ... */
  },

  // 共享
  errors: {
    /* ... */
  },
  validation: {
    /* ... */
  },
} as const;
```

### 2. 类型安全

```typescript
// 使用 as const 确保类型推断
const translations = {
  hello: '你好',
} as const;

// 导出类型
export type TranslationKeys = keyof typeof translations;
```

### 3. 键名规范

- 使用小写字母和下划线
- 使用点号分隔命名空间
- 保持一致性

```typescript
{
  "user.profile.name": "姓名",        // ✅ 推荐
  "user.profile.email": "邮箱",       // ✅ 推荐
  "UserProfileName": "姓名",          // ❌ 不推荐
  "user_profile_name": "姓名",        // ❌ 不推荐
}
```

### 4. 避免在渲染中创建翻译函数

```tsx
// ❌ 不推荐
function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      {['item1', 'item2'].map((key) => (
        <span key={key}>{t(key)}</span>
      ))}
    </div>
  );
}

// ✅ 推荐
function MyComponent() {
  const { t } = useTranslation();

  const items = useMemo(
    () => [
      { key: 'item1', label: t('item1') },
      { key: 'item2', label: t('item2') },
    ],
    [t]
  );

  return (
    <div>
      {items.map((item) => (
        <span key={item.key}>{item.label}</span>
      ))}
    </div>
  );
}
```

## 与其他库对比

| 特性       | LyricNote i18n | i18next | react-intl |
| ---------- | -------------- | ------- | ---------- |
| 体积       | < 5KB          | ~50KB   | ~60KB      |
| 依赖       | 0              | 多个    | 多个       |
| React 集成 | ✅             | ✅      | ✅         |
| 跨平台     | ✅             | ✅      | ⚠️         |
| 类型安全   | ✅             | ⚠️      | ✅         |
| 学习成本   | 低             | 中      | 中         |
| 插值       | ✅             | ✅      | ✅         |
| 复数       | 简单           | 完整    | 完整       |
| 格式化     | ❌             | ✅      | ✅         |
| 懒加载     | 手动           | ✅      | ✅         |

## FAQ

### 如何在非 React 环境使用？

```typescript
import { t } from '@lyricnote/shared';

// 直接使用 t 函数
console.log(t('common.hello'));
```

### 如何实现语言懒加载？

```typescript
async function loadLanguage(locale: Locale) {
  const translations = await import(`./locales/${locale}.ts`);
  getI18n().addResources(locale, translations.default);
  getI18n().setLocale(locale);
}
```

### 如何处理日期和数字格式化？

i18n 库专注于文本翻译，日期和数字格式化建议使用原生 API：

```typescript
// 日期格式化
new Intl.DateTimeFormat('zh-CN').format(new Date());

// 数字格式化
new Intl.NumberFormat('zh-CN').format(1234567.89);

// 货币格式化
new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
}).format(100);
```

### 如何在 SSR 中使用？

```typescript
// 服务端
import { createI18n, zhCN, enUS } from '@lyricnote/shared';

function getI18nForRequest(locale: Locale) {
  return createI18n({
    locale,
    fallbackLocale: 'zh-CN',
    resources: {
      'zh-CN': zhCN,
      'en-US': enUS,
    },
  });
}

// 每个请求创建独立的 i18n 实例
const i18n = getI18nForRequest('zh-CN');
const text = i18n.t('common.hello');
```

## 许可

MIT
