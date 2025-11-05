# Examples

这里包含 React Utils Kit 的使用示例。

## 示例列表

### 1. basic-usage.tsx
基础功能演示，包括：
- Logger 使用
- String Utils
- Array Utils
- useLocalStorage Hook

### 2. react-app-example.tsx
完整的 React 应用示例，展示：
- 用户认证流程
- 表单验证
- 错误处理和重试
- 主题切换
- 数据持久化

## 如何运行示例

### 方式 1: 在现有 React 项目中使用

1. 安装依赖
```bash
npm install @react-utils-kit/core
```

2. 复制示例代码到你的项目中

3. 导入并使用
```tsx
import App from './examples/react-app-example';
```

### 方式 2: 创建新的演示项目

```bash
# 创建新项目
npx create-react-app demo-app --template typescript
cd demo-app

# 安装库
npm install @react-utils-kit/core

# 复制示例文件
# 将 examples/ 目录中的文件复制到 src/

# 启动开发服务器
npm start
```

### 方式 3: 使用 CodeSandbox

访问 [CodeSandbox](https://codesandbox.io) 并创建新的 React + TypeScript 项目，然后安装 `@react-utils-kit/core` 并复制示例代码。

## 学习路径

建议按以下顺序学习：

1. **basic-usage.tsx** - 了解基本API
2. **react-app-example.tsx** - 学习在实际应用中的使用

## 更多资源

- [完整 API 文档](../docs/)
- [GitHub Repository](https://github.com/your-org/react-utils-kit)
- [NPM Package](https://www.npmjs.com/package/@react-utils-kit/core)

