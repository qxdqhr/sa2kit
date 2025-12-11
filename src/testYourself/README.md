# 测测你是什么 - 趣味测试模块

## 📖 简介

一个基于设备指纹的趣味测试小游戏模块。通过分析用户的设备特征（User Agent、IP地址、屏幕分辨率等），生成唯一且稳定的测试结果。

### 特点

- ✅ **稳定性**: 同一设备每次访问得到相同结果
- ✅ **趣味性**: 45个精心设计的结果选项
- ✅ **交互性**: 长按按钮的独特交互方式
- ✅ **持久化**: 使用 localStorage 保存结果
- ✅ **隐私保护**: 所有计算在本地完成
- ✅ **可配置**: 预留完整的配置接口

## 🚀 快速开始

### 安装

```bash
npm install sa2kit
# 或
pnpm add sa2kit
```

### 基础使用

```tsx
import { TestYourself } from 'sa2kit/testYourself';
import type { TestConfig } from 'sa2kit/testYourself';

const config: TestConfig = {
  gameTitle: '测测你是什么',
  gameDescription: '长按按钮，发现你的专属属性',
  buttonText: '长按开始',
  longPressDuration: 2000,
  results: [], // 使用默认的45个结果
};

function App() {
  return <TestYourself config={config} />;
}
```

## 📝 配置选项

### TestConfig

```typescript
interface TestConfig {
  /** 游戏标题 */
  gameTitle: string;
  
  /** 游戏描述（可选） */
  gameDescription?: string;
  
  /** 按钮文本（默认: "长按开始测试"） */
  buttonText?: string;
  
  /** 长按时间（毫秒，默认: 2000） */
  longPressDuration?: number;
  
  /** 结果数据集（默认: DEFAULT_RESULTS 45个） */
  results: TestResult[];
  
  /** 是否启用IP获取（默认: false） */
  enableIPFetch?: boolean;
  
  /** 自定义盐值（用于哈希计算） */
  customSalt?: string;
  
  /** 结果展示样式（默认: 'card'） */
  resultStyle?: 'card' | 'full' | 'minimal';
}
```

### TestResult

```typescript
interface TestResult {
  /** 唯一标识 */
  id: string;
  
  /** 标题/题目 */
  title: string;
  
  /** 描述 */
  description: string;
  
  /** 图片URL或emoji */
  image: string;
  
  /** 图片类型 */
  imageType?: 'url' | 'emoji';
  
  /** 额外属性（可扩展） */
  extra?: Record<string, any>;
}
```

## 🎯 工作原理

### 设备指纹生成

模块会收集以下设备信息（所有数据仅在本地处理）：

```typescript
{
  userAgent: string;        // 浏览器User Agent
  screenResolution: string; // 屏幕分辨率
  timezone: string;         // 时区
  language: string;         // 语言
  platform: string;         // 平台
  ip?: string;             // IP地址（可选，需启用）
}
```

### 哈希计算

使用 DJB2 哈希算法，结合设备指纹和盐值生成唯一标识：

```typescript
hash = DJB2(userAgent + ip + screenResolution + timezone + language + platform + salt)
```

### 结果选择

```typescript
resultIndex = hash % totalResults
```

## ⚠️ IP 地址获取

由于浏览器安全限制，直接获取IP地址需要调用外部API：

```typescript
// 启用IP获取
const config: TestConfig = {
  enableIPFetch: true,
  // ...
};
```

**注意事项：**
- 需要CORS支持
- 如果获取失败，会显示警告但不影响功能
- 默认使用 `https://api.ipify.org` API
- 如果无法获取IP，仅使用其他设备特征

## 📊 默认结果数据

模块提供45个预设结果，分为4大类：

### 动物系列 (15个)
🐱 猫咪、🐕 狗狗、🐼 熊猫、🦊 狐狸、🦉 猫头鹰...

### 星球/天气系列 (10个)
☀️ 太阳、🌙 月亮、⭐ 星星、🌈 彩虹、⚡ 闪电...

### 植物系列 (10个)
🌳 大树、🌸 花朵、🌻 向日葵、🌹 玫瑰、🌵 仙人掌...

### 食物系列 (10个)
☕ 咖啡、🍕 披萨、🍪 饼干、🍦 冰淇淋、🎂 蛋糕...

## 🔧 高级用法

### 自定义结果数据

```typescript
import type { TestResult } from 'sa2kit/testYourself';

const customResults: TestResult[] = [
  {
    id: 'hero-1',
    title: '勇敢的战士',
    description: '你拥有无畏的勇气...',
    image: '⚔️',
    imageType: 'emoji',
  },
  // ... 更多自定义结果
];

const config: TestConfig = {
  gameTitle: '测测你是哪种英雄',
  results: customResults,
};
```

### 使用图片URL

```typescript
{
  id: 'custom-1',
  title: '神秘角色',
  description: '描述...',
  image: 'https://example.com/image.jpg',
  imageType: 'url',
}
```

### 结果回调

```typescript
<TestYourself
  config={config}
  onResult={(result) => {
    console.log('用户获得:', result);
    // 发送到分析服务
    // 保存到数据库
    // 分享到社交媒体
  }}
/>
```

### 自定义盐值

```typescript
const config: TestConfig = {
  customSalt: 'my-unique-salt-2024',
  // ...
};
```

## 💾 数据持久化

结果自动保存到 localStorage：

```typescript
// 键名
const STORAGE_KEY = 'test-yourself-result';

// 手动清除
localStorage.removeItem('test-yourself-result');
```

## 🎨 样式定制

组件使用 Tailwind CSS，支持自定义样式：

```tsx
<TestYourself
  config={config}
  className="custom-class"
/>
```

结果展示样式：

```typescript
{
  resultStyle: 'card'    // 卡片样式（默认）
  resultStyle: 'full'    // 全屏样式
  resultStyle: 'minimal' // 简约样式
}
```

## 🔐 隐私说明

- ✅ 所有计算在客户端完成
- ✅ 不会上传任何数据到服务器
- ✅ IP地址获取是可选的
- ✅ 使用localStorage本地存储
- ✅ 无追踪、无cookie

## 📱 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要支持：
- localStorage
- Fetch API
- ES6+

## 🚧 未来功能（配置化接口已预留）

- [ ] 管理后台配置结果数据
- [ ] 自定义主题和样式
- [ ] 结果分享功能
- [ ] 多语言支持
- [ ] 统计分析功能

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！



