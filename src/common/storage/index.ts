/**
 * @package sa2kit/common/storage
 * 跨平台存储适配器与 Hooks
 */
export type { StorageAdapter, StorageChangeEvent } from './types';
export { WebStorageAdapter } from './adapters/web-adapter';
export { ReactNativeStorageAdapter } from './adapters/react-native-adapter';
export { MiniAppStorageAdapter } from './adapters/miniapp-adapter';
export { ElectronStorageAdapter } from './adapters/electron-adapter';
export * from './hooks';
