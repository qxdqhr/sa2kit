/**
 * 测测你是什么 - 配置管理服务
 * Test Yourself - Configuration Management Service
 * 
 * 服务端逻辑：配置的增删改查
 */

import type { SavedConfig, TestConfig, ConfigListItem } from '../types';

export interface ConfigServiceOptions {
  /** 存储类型 */
  storageType?: 'localStorage' | 'memory' | 'custom';
  /** 自定义存储适配器 */
  customStorage?: IConfigStorage;
  /** 是否启用缓存 */
  enableCache?: boolean;
}

/**
 * 配置存储适配器接口
 */
export interface IConfigStorage {
  /** 保存配置 */
  saveConfig(config: SavedConfig): Promise<void>;
  /** 获取配置 */
  getConfig(id: string): Promise<SavedConfig | null>;
  /** 获取所有配置列表 */
  getAllConfigs(): Promise<SavedConfig[]>;
  /** 删除配置 */
  deleteConfig(id: string): Promise<void>;
  /** 更新配置 */
  updateConfig(id: string, config: SavedConfig): Promise<void>;
  /** 设置默认配置 */
  setDefaultConfig(id: string): Promise<void>;
  /** 获取默认配置 */
  getDefaultConfig(): Promise<SavedConfig | null>;
}

/**
 * LocalStorage 存储适配器
 */
class LocalStorageAdapter implements IConfigStorage {
  private readonly STORAGE_KEY = 'test-yourself-configs';
  private readonly DEFAULT_KEY = 'test-yourself-default-config';

  private async getAllConfigsData(): Promise<SavedConfig[]> {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('读取配置失败:', error);
      return [];
    }
  }

  private async saveAllConfigsData(configs: SavedConfig[]): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('保存配置失败:', error);
      throw error;
    }
  }

  async saveConfig(config: SavedConfig): Promise<void> {
    const configs = await this.getAllConfigsData();
    const existingIndex = configs.findIndex(c => c.id === config.id);
    
    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }
    
    await this.saveAllConfigsData(configs);
  }

  async getConfig(id: string): Promise<SavedConfig | null> {
    const configs = await this.getAllConfigsData();
    return configs.find(c => c.id === id) || null;
  }

  async getAllConfigs(): Promise<SavedConfig[]> {
    return this.getAllConfigsData();
  }

  async deleteConfig(id: string): Promise<void> {
    const configs = await this.getAllConfigsData();
    const filtered = configs.filter(c => c.id !== id);
    await this.saveAllConfigsData(filtered);
  }

  async updateConfig(id: string, config: SavedConfig): Promise<void> {
    const configs = await this.getAllConfigsData();
    const index = configs.findIndex(c => c.id === id);
    
    if (index >= 0) {
      configs[index] = { ...config, updatedAt: Date.now() };
      await this.saveAllConfigsData(configs);
    } else {
      throw new Error('配置不存在: ' + (id));
    }
  }

  async setDefaultConfig(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const config = await this.getConfig(id);
    if (!config) {
      throw new Error('配置不存在: ' + (id));
    }
    
    // 清除其他配置的默认标记
    const configs = await this.getAllConfigsData();
    configs.forEach(c => c.isDefault = c.id === id);
    await this.saveAllConfigsData(configs);
    
    // 保存默认配置ID
    localStorage.setItem(this.DEFAULT_KEY, id);
  }

  async getDefaultConfig(): Promise<SavedConfig | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const defaultId = localStorage.getItem(this.DEFAULT_KEY);
      if (defaultId) {
        return await this.getConfig(defaultId);
      }
      
      // 如果没有设置默认配置，返回第一个标记为默认的配置
      const configs = await this.getAllConfigsData();
      return configs.find(c => c.isDefault) || null;
    } catch (error) {
      console.error('获取默认配置失败:', error);
      return null;
    }
  }
}

/**
 * 内存存储适配器（用于测试或SSR）
 */
class MemoryStorageAdapter implements IConfigStorage {
  private configs: Map<string, SavedConfig> = new Map();
  private defaultConfigId: string | null = null;

  async saveConfig(config: SavedConfig): Promise<void> {
    this.configs.set(config.id, config);
  }

  async getConfig(id: string): Promise<SavedConfig | null> {
    return this.configs.get(id) || null;
  }

  async getAllConfigs(): Promise<SavedConfig[]> {
    return Array.from(this.configs.values());
  }

  async deleteConfig(id: string): Promise<void> {
    this.configs.delete(id);
    if (this.defaultConfigId === id) {
      this.defaultConfigId = null;
    }
  }

  async updateConfig(id: string, config: SavedConfig): Promise<void> {
    if (!this.configs.has(id)) {
      throw new Error('配置不存在: ' + (id));
    }
    this.configs.set(id, { ...config, updatedAt: Date.now() });
  }

  async setDefaultConfig(id: string): Promise<void> {
    if (!this.configs.has(id)) {
      throw new Error('配置不存在: ' + (id));
    }
    
    // 清除其他配置的默认标记
    this.configs.forEach(c => c.isDefault = c.id === id);
    this.defaultConfigId = id;
  }

  async getDefaultConfig(): Promise<SavedConfig | null> {
    if (this.defaultConfigId) {
      return this.configs.get(this.defaultConfigId) || null;
    }
    
    // 返回第一个标记为默认的配置
    for (const config of this.configs.values()) {
      if (config.isDefault) {
        return config;
      }
    }
    
    return null;
  }
}

/**
 * 配置管理服务
 */
export class ConfigService {
  private storage: IConfigStorage;
  private cache: Map<string, SavedConfig> = new Map();
  private enableCache: boolean;

  constructor(options: ConfigServiceOptions = {}) {
    const {
      storageType = 'localStorage',
      customStorage,
      enableCache = true,
    } = options;

    this.enableCache = enableCache;

    if (customStorage) {
      this.storage = customStorage;
    } else if (storageType === 'memory') {
      this.storage = new MemoryStorageAdapter();
    } else {
      this.storage = new LocalStorageAdapter();
    }
  }

  /**
   * 初始化服务（如果需要）
   */
  async init(): Promise<void> {
    // 基础类不需要初始化，但子类或适配器可能需要
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return 'config_' + (Date.now()) + '_' + (Math.random().toString(36).substring(2, 9));
  }

  /**
   * 保存配置
   */
  async saveConfig(config: SavedConfig): Promise<void> {
    await this.storage.saveConfig(config);

    if (config.isDefault) {
      await this.storage.setDefaultConfig(config.id);
    }

    if (this.enableCache) {
      this.cache.set(config.id, config);
    }
  }

  /**
   * 创建新配置
   */
  async createConfig(
    name: string,
    config: TestConfig,
    description?: string,
    isDefault = false
  ): Promise<SavedConfig> {
    const savedConfig: SavedConfig = {
      id: this.generateId(),
      name,
      description,
      config,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault,
    };

    await this.storage.saveConfig(savedConfig);

    if (isDefault) {
      await this.storage.setDefaultConfig(savedConfig.id);
    }

    if (this.enableCache) {
      this.cache.set(savedConfig.id, savedConfig);
    }

    return savedConfig;
  }

  /**
   * 获取配置
   */
  async getConfig(id: string): Promise<SavedConfig | null> {
    // 先查缓存
    if (this.enableCache && this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const config = await this.storage.getConfig(id);

    if (config && this.enableCache) {
      this.cache.set(id, config);
    }

    return config;
  }

  /**
   * 获取所有配置列表
   */
  async getAllConfigs(): Promise<SavedConfig[]> {
    return await this.storage.getAllConfigs();
  }

  /**
   * 获取配置列表（精简版）
   */
  async getConfigList(): Promise<ConfigListItem[]> {
    const configs = await this.getAllConfigs();
    return configs.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      resultCount: c.config.results.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      isDefault: c.isDefault,
    }));
  }

  /**
   * 更新配置
   */
  async updateConfig(
    id: string,
    updates: {
      name?: string;
      description?: string;
      config?: TestConfig;
      isDefault?: boolean;
    }
  ): Promise<SavedConfig> {
    const existing = await this.getConfig(id);
    if (!existing) {
      throw new Error('配置不存在: ' + (id));
    }

    const updated: SavedConfig = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.storage.updateConfig(id, updated);

    if (updates.isDefault) {
      await this.storage.setDefaultConfig(id);
    }

    if (this.enableCache) {
      this.cache.set(id, updated);
    }

    return updated;
  }

  /**
   * 删除配置
   */
  async deleteConfig(id: string): Promise<void> {
    await this.storage.deleteConfig(id);

    if (this.enableCache) {
      this.cache.delete(id);
    }
  }

  /**
   * 设置默认配置
   */
  async setDefaultConfig(id: string): Promise<void> {
    await this.storage.setDefaultConfig(id);

    // 清理缓存，让下次获取时重新加载
    if (this.enableCache) {
      this.cache.clear();
    }
  }

  /**
   * 获取默认配置
   */
  async getDefaultConfig(): Promise<SavedConfig | null> {
    return await this.storage.getDefaultConfig();
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 导出配置（JSON格式）
   */
  async exportConfig(id: string): Promise<string> {
    const config = await this.getConfig(id);
    if (!config) {
      throw new Error('配置不存在: ' + (id));
    }
    return JSON.stringify(config, null, 2);
  }

  /**
   * 导入配置
   */
  async importConfig(jsonString: string): Promise<SavedConfig> {
    try {
      const data = JSON.parse(jsonString) as SavedConfig;
      
      // 生成新ID，避免冲突
      const newConfig: SavedConfig = {
        ...data,
        id: this.generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: false, // 导入的配置不设为默认
      };

      await this.storage.saveConfig(newConfig);

      if (this.enableCache) {
        this.cache.set(newConfig.id, newConfig);
      }

      return newConfig;
    } catch (error) {
      throw new Error('导入配置失败: ' + (error));
    }
  }

  /**
   * 复制配置
   */
  async duplicateConfig(id: string, newName?: string): Promise<SavedConfig> {
    const original = await this.getConfig(id);
    if (!original) {
      throw new Error('配置不存在: ' + (id));
    }

    const duplicated: SavedConfig = {
      ...original,
      id: this.generateId(),
      name: newName || (original.name) + ' (副本)',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false,
    };

    await this.storage.saveConfig(duplicated);

    if (this.enableCache) {
      this.cache.set(duplicated.id, duplicated);
    }

    return duplicated;
  }

  /**
   * 批量删除配置
   */
  async deleteConfigs(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.deleteConfig(id);
    }
  }
}

/**
 * 创建默认配置服务实例
 */
export function createConfigService(options?: ConfigServiceOptions): ConfigService {
  return new ConfigService(options);
}

/**
 * 默认配置服务实例（单例）
 */
let defaultServiceInstance: ConfigService | null = null;

export function getDefaultConfigService(): ConfigService {
  if (!defaultServiceInstance) {
    defaultServiceInstance = createConfigService();
  }
  return defaultServiceInstance;
}


