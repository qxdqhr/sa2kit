/**
 * 测测你是什么 - 服务端逻辑入口
 * Test Yourself - Server Logic Entry
 */

// ========== 配置服务 ==========
export {
  ConfigService,
  createConfigService,
  getDefaultConfigService,
} from './ConfigService';

export type {
  ConfigServiceOptions,
  IConfigStorage,
} from './ConfigService';

// ========== 数据库适配器 ==========
export {
  DatabaseConfigAdapter,
  createDatabaseConfigAdapter,
} from './DatabaseConfigAdapter';

export type {
  DatabaseConfigAdapterOptions,
  DrizzleDb,
} from './DatabaseConfigAdapter';

// ========== 数据库 Schema ==========
export {
  testYourselfConfigs,
  testYourselfConfigUsage,
  testYourselfConfigShares,
} from './drizzle-schema';

export type {
  TestYourselfConfig,
  NewTestYourselfConfig,
  TestYourselfConfigUsage,
  NewTestYourselfConfigUsage,
  TestYourselfConfigShare,
  NewTestYourselfConfigShare,
} from './drizzle-schema';
