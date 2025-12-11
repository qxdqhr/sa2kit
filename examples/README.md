# SA2Kit 示例项目

这是一个基于 Next.js 的示例项目，用于测试和展示 SA2Kit 组件库的各种功能。

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 运行开发服务器

```bash
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 可用组件示例

### 1. 图片网格裁剪工具 ✂️

路径: `/image-crop`

功能:
- 上传图片
- 设置网格行列数
- 自定义单元格尺寸
- 调整网格位置
- 选择性导出
- 批量下载为 ZIP

应用场景:
- 🎮 游戏开发 - 精灵图裁剪
- 🎨 图片编辑 - 批量裁剪
- 📱 图标生成 - 多尺寸生成
- 🗺️ 瓦片地图 - 地图切片

### 2. 音频检测 🎵

路径: `/audio-detection`

功能:
- 实时音频检测
- 音符识别
- 和弦分析
- 钢琴键盘可视化
- 多种配置选项

示例类型:
- 基础示例 - 预构建组件
- 自定义 UI - Hook + 钢琴键盘
- 高级配置 - 完全自定义

### 3. 基础使用 📚

路径: `/basic-usage`

功能:
- Storage Hook 示例
- 主题切换
- 持久化计数器
- 用户偏好设置

学习内容:
- `useLocalStorage` Hook 使用
- 状态持久化
- React 最佳实践

### 4. React 应用示例 ⚛️

路径: `/react-app`

功能:
- 用户登录/登出
- 表单验证
- 主题切换
- 数据持久化

展示内容:
- 完整应用结构
- 状态管理
- 用户体验优化
- localStorage 集成

## 项目结构

```
examples/
├── app/                    # Next.js App Router 页面
│   ├── image-crop/        # 图片裁剪示例
│   ├── audio-detection/   # 音频检测示例
│   ├── basic-usage/       # 基础使用示例
│   ├── react-app/         # React 应用示例
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── public/                # 静态资源
├── package.json           # 项目配置
└── README.md             # 本文件
```

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **图标**: Lucide React
- **组件库**: SA2Kit (本地 workspace)

## 开发指南

### 添加新的示例页面

1. 在 `app` 目录下创建新文件夹
2. 添加 `page.tsx` 文件
3. 在首页 (`app/page.tsx`) 添加导航链接

### 使用 SA2Kit 组件

```tsx
import { ComponentName } from 'sa2kit/moduleName';

// 使用组件
<ComponentName {...props} />
```

### 可用模块

- `sa2kit/imageCrop` - 图片裁剪工具
- `sa2kit/audioDetection` - 音频检测工具
- `sa2kit/storage` - 存储工具（含 Hooks）
- `sa2kit/logger` - 日志工具
- `sa2kit/i18n` - 国际化
- `sa2kit/analytics` - 分析统计
- `sa2kit/utils` - 工具函数
- 更多模块...

## 构建生产版本

```bash
pnpm build
pnpm start
```

## 注意事项

- 本项目仅用于开发测试，不会被包含在 npm 发布包中
- 使用 `workspace:*` 引用本地的 SA2Kit 包
- 所有修改都会被 git 跟踪

## 相关链接

- [SA2Kit 文档](../README.md)
- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
