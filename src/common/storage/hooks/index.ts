/**
 * Storage Hooks
 *
 * 提供跨平台存储的 React Hooks
 */

// 通用 Hook
export { useStorage } from './useStorage';

// 平台特定 Hooks
export { useLocalStorage } from './useLocalStorage';
export { useAsyncStorage } from './useAsyncStorage';
export { useTaroStorage } from './useTaroStorage';
export { useElectronStorage } from './useElectronStorage';

