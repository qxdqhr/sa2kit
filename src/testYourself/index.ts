/**
 * 测测你是什么 - 模块入口
 * Test Yourself Game Module
 * 
 * 一个基于设备指纹的趣味测试小游戏
 * 支持多套配置管理和后台管理功能
 * 
 * @package sa2kit/testYourself
 */

// 组件
export * from './components';

// 管理后台组件
export * from './admin';

// 服务端逻辑
export * from './server';

// 类型
export type {
  TestResult,
  TestConfig,
  DeviceFingerprint,
  TestStatus,
  TestYourselfProps,
  SavedConfig,
  UploadResult,
  ConfigListItem,
} from './types';

// 工具函数
export {
  getDeviceFingerprint,
  tryGetIPAddress,
  generateDeviceHash,
  selectResultIndex,
} from './utils';

// 默认数据
export { DEFAULT_RESULTS } from './data/defaultResults';














