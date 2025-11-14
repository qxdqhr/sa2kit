/**
 * 配置服务工厂函数
 *
 * 提供便捷的工厂函数来创建 ConfigService 和 ConfigEngine 实例
 */

import { ConfigService, type ConfigServiceOptions } from './service';
import { ConfigEngine, type ConfigEngineOptions } from './engine';

/**
 * 创建 ConfigService 实例的工厂函数
 */
export function createConfigService(options: ConfigServiceOptions): ConfigService {
  return new ConfigService(options);
}

/**
 * 创建 ConfigEngine 实例的工厂函数
 */
export function createConfigEngine(options: ConfigEngineOptions): ConfigEngine {
  return new ConfigEngine(options);
}

/**
 * 创建全局单例的 ConfigService 工厂
 *
 * @example
 * ```typescript
 * const getConfigService = createGlobalConfigService({
 *   db,
 *   tables: { systemConfigs, configMetadata, configHistory }
 * });
 *
 * // 在任何地方使用
 * const service = getConfigService();
 * ```
 */
export function createGlobalConfigService(options: ConfigServiceOptions): () => ConfigService {
  let instance: ConfigService | null = null;

  return () => {
    if (!instance) {
      instance = new ConfigService(options);
    }
    return instance;
  };
}

/**
 * 创建全局单例的 ConfigEngine 工厂
 *
 * @example
 * ```typescript
 * const getConfigEngine = createGlobalConfigEngine({
 *   db,
 *   tables: { systemConfigs, configDefinitions, configHistory }
 * });
 *
 * // 在任何地方使用
 * const engine = getConfigEngine();
 * await engine.initialize();
 * ```
 */
export function createGlobalConfigEngine(options: ConfigEngineOptions): () => ConfigEngine {
  let instance: ConfigEngine | null = null;
  let isInitializing = false;

  return () => {
    if (!instance) {
      instance = new ConfigEngine(options);

      // 自动初始化（仅一次）
      if (!isInitializing) {
        isInitializing = true;
        instance.initialize().catch((error) => {
          console.error('[ConfigEngine] 初始化失败:', error);
        });
      }
    }
    return instance;
  };
}


