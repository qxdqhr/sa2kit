/**
 * Storage 存储模块
 *
 * 提供跨平台存储适配器和 Hooks
 */

// 类型定义
export type { StorageAdapter, StorageChangeEvent } from './types';

// 平台适配器
export { WebStorageAdapter } from './web-adapter';
export { ReactNativeStorageAdapter } from './adapters/react-native-adapter';
export { MiniAppStorageAdapter } from './adapters/miniapp-adapter';
export { ElectronStorageAdapter } from './adapters/electron-adapter';

// Hooks
export * from './hooks';
