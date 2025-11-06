# Tailwind CSS 配置指南

如果你使用 SA2Kit 的 UI 组件（如 `AnalyticsDashboard` 或 `LanguageSwitcher`），需要配置 Tailwind CSS。

## 快速开始

### 1. 安装 Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. 扩展 Tailwind 配置

SA2Kit 提供了预设的动画配置，你可以选择性地在项目中使用。

#### 方法 A：使用 SA2Kit 动画预设（推荐）

```javascript
// tailwind.config.js
const sa2kitAnimations = require('@qhr123/sa2kit/tailwind.animations');

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@qhr123/sa2kit/**/*.{js,mjs}', // 包含 SA2Kit 组件
  ],
  theme: {
    extend: {
      // 添加 SA2Kit 动画
      ...sa2kitAnimations,
    },
  },
  plugins: [],
};
```

#### 方法 B：手动配置动画

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@qhr123/sa2kit/**/*.{js,mjs}',
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
```

### 3. 引入 Tailwind CSS

```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. 在应用中导入样式

```javascript
// _app.tsx 或 main.tsx
import './styles/globals.css';
```

## 使用的动画类

SA2Kit 组件使用以下 Tailwind 动画类：

- `animate-fade-in` - 淡入动画
- `animate-slide-up` - 上滑动画

## 组件示例

### Analytics Dashboard

```tsx
import { AnalyticsDashboard } from '@qhr123/sa2kit/analytics';

function App() {
  return <AnalyticsDashboard apiBaseUrl="/api/analytics" />;
}
```

### Language Switcher

```tsx
import { LanguageSwitcher } from '@qhr123/sa2kit/i18n';

function App() {
  return <LanguageSwitcher variant="dropdown" />;
}
```

## 常见问题

### Q: 动画不显示？

A: 确保你已经：
1. 在 `tailwind.config.js` 的 `content` 数组中包含了 SA2Kit 的文件路径
2. 扩展了动画配置（使用预设或手动配置）
3. 在应用入口导入了 Tailwind CSS

### Q: 可以自定义动画吗？

A: 可以！你可以在 `tailwind.config.js` 中覆盖或扩展动画：

```javascript
module.exports = {
  theme: {
    extend: {
      animation: {
        // 自定义更快的淡入动画
        'fade-in': 'fadeIn 0.2s ease-in-out forwards',
      },
    },
  },
};
```

### Q: 不想使用动画怎么办？

A: 组件会优雅降级。如果 Tailwind 配置中没有定义这些动画，组件仍然可以正常显示，只是没有动画效果。

## Next.js 配置示例

```javascript
// tailwind.config.js (Next.js)
const sa2kitAnimations = require('@qhr123/sa2kit/tailwind.animations');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@qhr123/sa2kit/**/*.{js,mjs}',
  ],
  theme: {
    extend: {
      ...sa2kitAnimations,
    },
  },
  plugins: [],
};
```

## Vite 配置示例

```javascript
// tailwind.config.js (Vite)
const sa2kitAnimations = require('@qhr123/sa2kit/tailwind.animations');

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@qhr123/sa2kit/**/*.{js,mjs}',
  ],
  theme: {
    extend: {
      ...sa2kitAnimations,
    },
  },
  plugins: [],
};
```

## 相关链接

- [Tailwind CSS 官方文档](https://tailwindcss.com/docs)
- [Tailwind CSS 动画文档](https://tailwindcss.com/docs/animation)
- [SA2Kit GitHub](https://github.com/qxdqhr/sa2kit)

