# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.0] - 2025-11-06

### Added
- **Analytics Server 模块** (`@qhr123/sa2kit/analytics/server`)
  - `createAnalyticsService` - 创建埋点服务实例（基于 Drizzle ORM）
  - `createAnalyticsHandlers` - 创建 API 路由处理器（支持 Next.js 等框架）
  - `analyticsEvents` - Drizzle ORM PostgreSQL Schema
  - 服务端类型：`AnalyticsEvent`, `AnalyticsQueryParams`, `AnalyticsStats`, 等
  - ✅ 批量插入事件
  - ✅ 事件查询和过滤
  - ✅ 统计分析（总览、用户行为、会话分析）
  - ✅ 漏斗分析
  - ✅ 完整的类型安全

### Changed
- Analytics 模块现在包含完整的服务端实现
- 服务端模块独立导出，避免客户端打包服务端依赖

### Documentation
- 新增 Analytics Server 使用文档

## [0.7.2] - 2025-11-06

### Added
- **Tailwind CSS 集成**
  - 新增 `tailwind.animations.js` 配置预设文件
  - 提供可选的动画配置，用户可在项目中扩展使用
  - 新增完整的 [Tailwind 配置指南](./docs/tailwind-setup.md)
  - 支持 Next.js、Vite 等主流框架

### Fixed
- **Analytics 模块类型冲突修复**
  - 重命名组件类型以避免与核心类型冲突
  - `AnalyticsEvent` (组件) → `DashboardEvent`
  - `AnalyticsStats` (组件) → `DashboardStats`
  - 核心 `AnalyticsEvent` 类型保持不变
  - 完整导出 Analytics 组件和类型

### Changed
- **样式系统优化**
  - 移除 `src/analytics/components/styles.css` 自定义样式文件
  - 完全采用 Tailwind CSS 方案
  - 动画类名更新：`animate-fadeIn` → `animate-fade-in`，`animate-slideUp` → `animate-slide-up`
  - 更好的定制化支持

### Improved
- 更新 README，添加 Tailwind 配置说明
- 优化组件导出结构
- 提升类型安全性和一致性

## [0.7.1] - 2025-11-06

### Changed
- **目录结构重构**: 将 `adapters` 拆分为独立的 `request` 和 `storage` 模块
- **导出路径变更**:
  - 原 `@qhr123/sa2kit/adapters` 现在分为：
    - `@qhr123/sa2kit/request` - 请求适配器
    - `@qhr123/sa2kit/storage` - 存储适配器（包含 hooks）

### Fixed
- 修复 TypeScript 导入路径问题

## [0.7.0] - 2025-11-06

### Added
- **Request 请求适配器** (`@qhr123/sa2kit/adapters`)
  - `WebRequestAdapter` - 基于 fetch API 的 Web 请求适配器
  - `MiniappRequestAdapter` - 基于 Taro.request 的小程序请求适配器
  - 类型：`RequestAdapter`, `RequestConfig`
  - ✅ 统一的请求接口
  - ✅ 跨平台支持（Web、Mobile、Miniapp）
  - ✅ 自动处理查询参数
  - ✅ Cookie 自动管理

- **Analytics UI 组件** (`@qhr123/sa2kit/analytics`)
  - `AnalyticsDashboard` - 完整的埋点数据仪表板
  - `StatCard` - 统计卡片组件
  - `EventList` - 事件列表组件
  - `FilterPanel` - 过滤面板组件
  - `Charts` - 图表组件集合
  - ✅ 开箱即用的数据可视化
  - ✅ 响应式设计
  - ✅ 完整的 TypeScript 类型支持

- **Adapters 统一导出** (`@qhr123/sa2kit/adapters`)
  - 统一导出所有存储和请求适配器
  - 简化导入路径

### Changed
- Analytics 模块现在包含 UI 组件
- 优化了适配器模块的组织结构

### Documentation
- 新增 Request Adapters 使用文档
- 新增 Analytics Components 使用文档

## [0.6.0] - 2025-11-06

### Added
- **Auth Hooks 模块** (`@qhr123/sa2kit/auth/hooks`)
  - `useAuth` - 完整的认证状态管理 Hook
  - `useAuthForm` - 表单验证和管理 Hook
  - 类型：`User`, `BaseApiClient`, `LoginFormData`, `RegisterFormData`, `AuthResult`, `UseAuthReturn`
  - ✅ 支持登录、注册、登出、自动检查认证状态
  - ✅ 完整的错误处理和加载状态
  - ✅ TypeScript 类型安全

- **Config Hooks 模块** (`@qhr123/sa2kit/config/hooks`)
  - `createUseConfigs` - 创建配置管理 Hook 的工厂函数
  - `prefetchConfigs` - 预加载配置
  - `invalidateAllConfigs` - 全局缓存失效
  - 类型：`ConfigItem`, `AllConfigs`, `UseConfigsOptions`
  - ✅ 基于 SWR 实现智能缓存
  - ✅ 自动重新验证和错误重试
  - ✅ 乐观更新支持
  - ✅ 支持多平台：Web、React Native、小程序
  - ⚠️ 依赖 `swr` (peerDependency)

- **Storage Hooks 模块** (`@qhr123/sa2kit/storage/hooks`)
  - `useStorage` - 通用存储 Hook
  - `useLocalStorage` - Web localStorage Hook
  - `useAsyncStorage` - React Native AsyncStorage Hook
  - `useTaroStorage` - 小程序 Taro Storage Hook
  - `useElectronStorage` - Electron Desktop Storage Hook
  - 完整的跨平台存储适配器：
    - `ReactNativeStorageAdapter`
    - `MiniAppStorageAdapter`
    - `ElectronStorageAdapter`
  - ✅ 统一的异步 API
  - ✅ 自动 JSON 序列化/反序列化
  - ✅ 类型安全
  - ✅ 错误处理
  - ✅ 存储变化监听（部分平台）

### Changed
- 重构模块结构，采用 `module/hooks` 子路径导出方式
- 旧的 `./hooks` 导出已移除，现在使用 `./storage/hooks`, `./auth/hooks`, `./config/hooks`
- 所有 storage hooks 现在统一在 `storage/hooks` 目录下

### Dependencies
- 新增 `swr` 作为可选的 peerDependency（config hooks 需要）

### Documentation
- 新增 Auth Hooks 使用文档
- 新增 Config Hooks 使用文档
- 更新 Storage Hooks 文档

## [0.5.0] - 2025-11-06

### Added
- **i18n UI 组件 (Tailwind CSS 版本)**: 完整的 LanguageSwitcher 组件迁移到 sa2kit
  - ✅ 使用 Tailwind CSS 样式，无需额外 CSS 文件
  - ✅ 支持 Next.js App Router ('use client' 指令)
  - ✅ 三种样式变体：buttons、dropdown、icon
  - ✅ 响应式设计，移动端友好
  - ✅ 完整的无障碍支持（ARIA attributes）
  - ✅ 平滑动画和交互效果
  - 导出：`LanguageSwitcher`, `LanguageSwitcherButtons`, `LanguageSwitcherDropdown`, `LanguageSwitcherIcon`
  - 类型：`LanguageSwitcherProps`, `LanguageOption`

### Changed
- 组件现在作为 sa2kit 的核心 UI 组件，可在任何 React + Tailwind 项目中使用

### Documentation
- 新增 Tailwind CSS 使用指南
- 更新组件使用示例

## [0.4.2] - 2025-11-06

### Added
- **i18n UI 组件**: 导出 `LanguageSwitcher` 组件
  - 支持三种样式：按钮组、下拉菜单、图标按钮
  - 完整的 TypeScript 类型支持
  - 使用 Tailwind CSS 样式

### Fixed
- 修复了 LanguageSwitcher 组件的循环依赖问题
- 修复了 TypeScript DTS 构建错误（添加 rootDir 配置）
- 修复了 useEffect 返回值类型问题
- 组件使用相对路径导入，避免循环依赖

## [0.4.1] - 2025-11-06

### Added
- **日语文本处理工具**: 新增 `japaneseUtils` 模块
  - extractKanji - 提取文本中的汉字
  - extractKana - 提取文本中的假名
  - cleanText - 清理文本，移除特殊字符但保留日语字符
- **i18n UI 组件**: 导出 `LanguageSwitcher` 组件
  - 支持三种样式：按钮组、下拉菜单、图标按钮
  - 完整的 TypeScript 类型支持
  - 使用 Tailwind CSS 样式

### Fixed
- 清理了 utils 目录中的重复文件，移除了 8 个 `*copy.ts` 文件
- 更新了 utils/index.ts，添加了 japaneseUtils 的正确导出
- 修复了 LanguageSwitcher 组件的循环依赖问题
- 修复了 TypeScript DTS 构建错误（添加 rootDir 配置）
- 修复了 useEffect 返回值类型问题

### Improved
- 代码库更加整洁，没有重复文件
- 更好的文件组织结构
- 组件使用相对路径导入，避免循环依赖

## [0.4.0] - 2025-11-06

### Added
- **完整的平台适配器**: 为 i18n 和 Analytics 模块添加了所有平台适配器
  - **i18n 平台适配器**:
    - WebI18nAdapter (浏览器环境)
    - ReactNativeI18nAdapter (React Native)
    - TaroI18nAdapter (小程序)
    - ElectronI18nAdapter (桌面应用)
  - **Analytics 平台适配器**:
    - Web 适配器 (WebStorageAdapter, WebNetworkAdapter, WebDeviceAdapter)
    - Mobile 适配器 (MobileStorageAdapter, MobileNetworkAdapter, MobileDeviceAdapter)
    - Miniapp 适配器 (MiniappStorageAdapter, MiniappNetworkAdapter, MiniappDeviceAdapter)
    - Desktop 适配器 (DesktopStorageAdapter, DesktopNetworkAdapter, DesktopDeviceAdapter)

### Changed
- 更新了 i18n 和 analytics 模块的文档说明
- 包描述更新为"包含平台适配器的跨平台工具库"

### Improved
- 所有适配器都包含完整的 TypeScript 类型定义
- 适配器支持依赖注入，便于自定义实现
- 统一的适配器接口，易于扩展

## [0.3.1] - 2025-11-06

### Fixed
- 修复了 analytics 模块的导出问题，添加了 client 单例管理器导出

## [0.3.0] - 2025-11-05

### Added
- **i18n 国际化模块**: 完整的多语言支持
  - 核心 i18n 实例管理
  - React Hooks (useTranslation, useLocale)
  - 示例语言包 (zh-CN, en-US)
  - 类型安全的翻译函数
- **Analytics 埋点分析模块**: 完整的事件追踪系统
  - 核心类 (Analytics, EventQueue, Uploader)
  - 事件装饰器 (@Track, @TrackClick, @TrackPerformance, @CatchError)
  - React Hooks (useAnalyticsEvent, usePageView, usePerformanceTracking)
  - 工具函数和辅助方法
  - 预设配置模板

### Note
- i18n 和 analytics 模块不包含平台特定的适配器
- 适配器需要在项目中根据实际平台实现

## [0.2.0] - 2025-11-05

### Added
- **Universal File Service**: Complete file upload/download management system
  - File upload with progress tracking
  - File metadata management
  - Multi-provider support (local, Aliyun OSS, AWS S3, Qcloud COS)
  - File query and batch operations
  - Comprehensive file validation utilities
- **Universal Export Service**: Flexible data export system
  - Multiple format support (CSV, Excel, JSON)
  - Customizable field configuration
  - Data grouping and transformation
  - Progress tracking
  - Template-based file naming

### Changed
- Updated package name references from `@lyricnote` to `@qhr123/sa2kit`
- Bumped version to 0.2.0

## [0.1.1] - 2025-11-05

### Added
- Initial project structure
- Logger system with console adapter
- Core utility functions
- Storage adapters
- React hooks for common patterns

## [0.1.0] - 2025-11-05

### Added
- Initial beta release
- Logger system with customizable adapters
- String, array, file, time utilities
- Cross-platform storage adapters
- useLocalStorage and useAsyncStorage hooks
- TypeScript support with full type definitions
- ESM and CJS module formats

[Unreleased]: https://github.com/your-org/react-utils-kit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/react-utils-kit/releases/tag/v0.1.0

