# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

