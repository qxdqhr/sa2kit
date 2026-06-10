/**
 * Music Module
 * 统一音乐搜索与播放模块 (前端-后端-Meting 集成)
 */

// 类型导出
export * from './types';

// 前端组件导出
export * from './components';

// 前端 Hooks 导出
export * from './hooks/useMusic';

// 适配器导出
export * from './adapters';

// 后端逻辑导出 (由子路径或环境判断决定如何使用)
// 注意：后端逻辑通常在 API 路由中使用
export * from './server';
