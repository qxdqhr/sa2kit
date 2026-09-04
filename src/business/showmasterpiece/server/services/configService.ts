/**
 * ShowMasterpiece模块 - 配置管理数据库服务
 * 
 * 独立的配置管理服务，不依赖全局配置服务
 */

import { 
  showmasterConfigCategories, 
  showmasterConfigItems, 
  showmasterConfigHistory,
  showmasterConfigPermissions,
  ShowmasterConfigCategory,
  ShowmasterConfigItem,
  ShowmasterConfigHistory,
  NewShowmasterConfigCategory,
  NewShowmasterConfigItem,
  NewShowmasterConfigHistory
} from '../schema/config';
import { eq, and, like, desc, asc, sql, count } from 'drizzle-orm';

/**
 * 配置搜索参数
 */
interface ConfigSearchParams {
  categoryId?: string;
  search?: string;
  type?: 'string' | 'number' | 'boolean' | 'json' | 'password';
  environment?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * 分页响应
 */
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * ShowMasterPieces配置管理服务
 */
export class ShowmasterConfigService {
  constructor(private readonly db: any) {}
  // ============= 配置分类管理 =============

  /**
   * 获取所有配置分类
   */
  async getAllCategories(): Promise<ShowmasterConfigCategory[]> {
    console.log('🎨 [ShowmasterConfigService] 获取所有配置分类');
    
    return await this.db
      .select()
      .from(showmasterConfigCategories)
      .where(eq(showmasterConfigCategories.isActive, true))
      .orderBy(asc(showmasterConfigCategories.sortOrder), asc(showmasterConfigCategories.displayName));
  }

  /**
   * 根据ID获取配置分类
   */
  async getCategoryById(id: string): Promise<ShowmasterConfigCategory | null> {
    console.log('🎨 [ShowmasterConfigService] 获取配置分类:', id);
    
    const [category] = await this.db
      .select()
      .from(showmasterConfigCategories)
      .where(and(
        eq(showmasterConfigCategories.id, id),
        eq(showmasterConfigCategories.isActive, true)
      ));
    
    return category || null;
  }

  /**
   * 根据名称获取配置分类
   */
  async getCategoryByName(name: string): Promise<ShowmasterConfigCategory | null> {
    console.log('🎨 [ShowmasterConfigService] 根据名称获取配置分类:', name);
    
    const [category] = await this.db
      .select()
      .from(showmasterConfigCategories)
      .where(and(
        eq(showmasterConfigCategories.name, name),
        eq(showmasterConfigCategories.isActive, true)
      ));
    
    return category || null;
  }

  /**
   * 创建配置分类
   */
  async createCategory(data: Omit<NewShowmasterConfigCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShowmasterConfigCategory> {
    console.log('🎨 [ShowmasterConfigService] 创建配置分类:', data.name);
    
    const [category] = await this.db
      .insert(showmasterConfigCategories)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();

    console.log('✅ [ShowmasterConfigService] 配置分类创建成功:', category.id);
    return category;
  }

  /**
   * 更新配置分类
   */
  async updateCategory(id: string, data: Partial<Omit<ShowmasterConfigCategory, 'id' | 'createdAt'>>): Promise<ShowmasterConfigCategory> {
    console.log('🎨 [ShowmasterConfigService] 更新配置分类:', id);
    
    const [category] = await this.db
      .update(showmasterConfigCategories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(showmasterConfigCategories.id, id))
      .returning();

    if (!category) {
      throw new Error('配置分类不存在');
    }

    console.log('✅ [ShowmasterConfigService] 配置分类更新成功:', category.id);
    return category;
  }

  /**
   * 删除配置分类
   */
  async deleteCategory(id: string): Promise<void> {
    console.log('🎨 [ShowmasterConfigService] 删除配置分类:', id);
    
    // 软删除：设置为不活跃
    await this.db
      .update(showmasterConfigCategories)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(showmasterConfigCategories.id, id));

    console.log('✅ [ShowmasterConfigService] 配置分类删除成功:', id);
  }

  // ============= 配置项管理 =============

  /**
   * 获取配置项列表（支持分页和搜索）
   */
  async getConfigItems(params: ConfigSearchParams = {}): Promise<PaginatedResponse<ShowmasterConfigItem>> {
    const {
      categoryId,
      search,
      type,
      environment = 'development',
      isActive = true,
      page = 1,
      pageSize = 50
    } = params;

    console.log('🎨 [ShowmasterConfigService] 获取配置项列表:', { environment, page, pageSize });

    // 构建查询条件
    const conditions = [];
    
    if (isActive !== undefined) {
      conditions.push(eq(showmasterConfigItems.isActive, isActive));
    }
    
    if (categoryId) {
      conditions.push(eq(showmasterConfigItems.categoryId, categoryId));
    }
    
    if (type) {
      conditions.push(eq(showmasterConfigItems.type, type));
    }
    
    if (environment) {
      conditions.push(eq(showmasterConfigItems.environment, environment));
    }
    
    if (search) {
      conditions.push(
        sql`(${showmasterConfigItems.key} ILIKE ${'%' + search + '%'} OR 
             ${showmasterConfigItems.displayName} ILIKE ${'%' + search + '%'} OR 
             ${showmasterConfigItems.description} ILIKE ${'%' + search + '%'})`
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // 获取总数
    const [{ totalCount }] = await this.db
      .select({ totalCount: count() })
      .from(showmasterConfigItems)
      .where(whereCondition);

    // 获取数据
    const items = await this.db
      .select()
      .from(showmasterConfigItems)
      .where(whereCondition)
      .orderBy(asc(showmasterConfigItems.sortOrder), asc(showmasterConfigItems.displayName))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const totalPages = Math.ceil(totalCount / pageSize);

    console.log(`✅ [ShowmasterConfigService] 找到 ${items.length}/${totalCount} 个配置项`);

    return {
      items,
      total: totalCount,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * 根据ID获取配置项
   */
  async getConfigItemById(id: string): Promise<ShowmasterConfigItem | null> {
    console.log('🎨 [ShowmasterConfigService] 获取配置项:', id);
    
    const [item] = await this.db
      .select()
      .from(showmasterConfigItems)
      .where(eq(showmasterConfigItems.id, id));
    
    return item || null;
  }

  /**
   * 根据key获取配置项
   */
  async getConfigItemByKey(key: string, environment: string = 'development'): Promise<ShowmasterConfigItem | null> {
    console.log('🎨 [ShowmasterConfigService] 根据key获取配置项:', key, '环境:', environment);
    
    const [item] = await this.db
      .select()
      .from(showmasterConfigItems)
      .where(and(
        eq(showmasterConfigItems.key, key),
        eq(showmasterConfigItems.environment, environment),
        eq(showmasterConfigItems.isActive, true)
      ));
    
    return item || null;
  }

  /**
   * 创建配置项
   */
  async createConfigItem(data: Omit<NewShowmasterConfigItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShowmasterConfigItem> {
    console.log('🎨 [ShowmasterConfigService] 创建配置项:', data.key);
    
    // 检查key是否已存在
    const existingItem = await this.getConfigItemByKey(data.key, data.environment || 'development');
    if (existingItem) {
      throw new Error(`配置项 ${data.key} 在 ${data.environment || 'development'} 环境中已存在`);
    }

    const [item] = await this.db
      .insert(showmasterConfigItems)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();

    // 记录历史
    await this.recordHistory(item.id, null, item.value, 'system', 'create', item.environment || 'development');

    console.log('✅ [ShowmasterConfigService] 配置项创建成功:', item.id);
    return item;
  }

  /**
   * 更新配置项
   */
  async updateConfigItem(id: string, data: Partial<Omit<ShowmasterConfigItem, 'id' | 'createdAt'>>, changedBy: string = 'system'): Promise<ShowmasterConfigItem> {
    console.log('🎨 [ShowmasterConfigService] 更新配置项:', id);
    
    // 获取旧值用于历史记录
    const oldItem = await this.getConfigItemById(id);
    if (!oldItem) {
      throw new Error('配置项不存在');
    }

    const [item] = await this.db
      .update(showmasterConfigItems)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(showmasterConfigItems.id, id))
      .returning();

    if (!item) {
      throw new Error('配置项不存在');
    }

    // 记录历史（如果值发生变化）
    if (data.value !== undefined && data.value !== oldItem.value) {
      await this.recordHistory(item.id, oldItem.value, data.value, changedBy, 'update', item.environment || 'development');
    }

    console.log('✅ [ShowmasterConfigService] 配置项更新成功:', item.id);
    return item;
  }

  /**
   * 删除配置项
   */
  async deleteConfigItem(id: string, changedBy: string = 'system'): Promise<void> {
    console.log('🎨 [ShowmasterConfigService] 删除配置项:', id);
    
    // 获取配置项信息用于历史记录
    const item = await this.getConfigItemById(id);
    if (!item) {
      throw new Error('配置项不存在');
    }

    // 记录历史
    await this.recordHistory(item.id, item.value, null, changedBy, 'delete', item.environment || 'development');

    // 软删除：设置为不活跃
    await this.db
      .update(showmasterConfigItems)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(showmasterConfigItems.id, id));

    console.log('✅ [ShowmasterConfigService] 配置项删除成功:', id);
  }

  // ============= 历史记录管理 =============

  /**
   * 记录配置变更历史
   */
  private async recordHistory(
    configItemId: string,
    oldValue: string | null,
    newValue: string | null,
    changedBy: string,
    operationType: 'create' | 'update' | 'delete',
    environment: string
  ): Promise<void> {
    try {
      await this.db
        .insert(showmasterConfigHistory)
        .values({
          configItemId,
          oldValue,
          newValue,
          changedBy,
          operationType,
          environment,
        });
      
      console.log(`📝 [ShowmasterConfigService] 历史记录已保存: ${operationType} for ${configItemId}`);
    } catch (error) {
      console.error('❌ [ShowmasterConfigService] 保存历史记录失败:', error);
      // 不抛出错误，避免影响主要操作
    }
  }

  /**
   * 获取配置项历史记录
   */
  async getConfigItemHistory(configItemId: string, limit: number = 50): Promise<ShowmasterConfigHistory[]> {
    console.log('🎨 [ShowmasterConfigService] 获取配置项历史:', configItemId);
    
    return await this.db
      .select()
      .from(showmasterConfigHistory)
      .where(eq(showmasterConfigHistory.configItemId, configItemId))
      .orderBy(desc(showmasterConfigHistory.createdAt))
      .limit(limit);
  }

  // ============= 工具方法 =============

  /**
   * 获取配置值（带类型转换）
   */
  async getConfigValue<T = string>(key: string, environment: string = 'development'): Promise<T | null> {
    const item = await this.getConfigItemByKey(key, environment);
    
    if (!item || !item.value) {
      return null;
    }

    try {
      switch (item.type) {
        case 'number':
          return Number(item.value) as T;
        case 'boolean':
          return (item.value.toLowerCase() === 'true') as T;
        case 'json':
          return JSON.parse(item.value) as T;
        default:
          return item.value as T;
      }
    } catch (error) {
      console.error(`❌ [ShowmasterConfigService] 配置值类型转换失败: ${key}`, error);
      return item.value as T;
    }
  }

  /**
   * 设置配置值
   */
  async setConfigValue(key: string, value: any, environment: string = 'development', changedBy: string = 'system'): Promise<void> {
    console.log('🎨 [ShowmasterConfigService] 设置配置值:', key, '环境:', environment);
    
    const item = await this.getConfigItemByKey(key, environment);
    
    if (!item) {
      throw new Error(`配置项 ${key} 在 ${environment} 环境中不存在`);
    }

    let stringValue: string;
    
    try {
      switch (item.type) {
        case 'json':
          stringValue = JSON.stringify(value);
          break;
        default:
          stringValue = String(value);
          break;
      }
    } catch (error) {
      throw new Error(`配置值转换失败: ${error}`);
    }

    await this.updateConfigItem(item.id, { value: stringValue }, changedBy);
  }

  /**
   * 初始化默认配置分类
   */
  async initializeDefaultCategories(): Promise<void> {
    console.log('🎨 [ShowmasterConfigService] 初始化默认配置分类');
    
    const defaultCategories = [
      {
        name: 'general',
        displayName: '通用配置',
        description: 'ShowMasterPieces模块通用配置项',
        icon: '⚙️',
        sortOrder: 0,
      },
      {
        name: 'display',
        displayName: '显示配置',
        description: '界面显示相关配置',
        icon: '🎨',
        sortOrder: 1,
      },
      {
        name: 'business',
        displayName: '业务配置',
        description: '业务逻辑相关配置',
        icon: '💼',
        sortOrder: 2,
      },
      {
        name: 'integration',
        displayName: '集成配置',
        description: '第三方服务集成配置',
        icon: '🔗',
        sortOrder: 3,
      },
    ];

    for (const category of defaultCategories) {
      try {
        // 检查是否已存在
        const existing = await this.db
          .select()
          .from(showmasterConfigCategories)
          .where(eq(showmasterConfigCategories.name, category.name));

        if (existing.length === 0) {
          await this.createCategory(category);
          console.log(`✅ [ShowmasterConfigService] 默认分类创建成功: ${category.name}`);
        }
      } catch (error) {
        console.error(`❌ [ShowmasterConfigService] 创建默认分类失败: ${category.name}`, error);
      }
    }
  }
}

// 导出单例实例


export function createShowmasterConfigService(db: any): ShowmasterConfigService {
  return new ShowmasterConfigService(db);
}
