/**
 * ShowMasterpiece 模块 - 弹窗配置数据库服务
 * 
 * 提供弹窗配置的CRUD操作
 * 
 * @fileoverview 弹窗配置数据库服务
 */

import { eq, and, desc } from 'drizzle-orm';
import { popupConfigs, PopupConfig, NewPopupConfig } from '../schema/popupConfig';

export class PopupConfigService {
  constructor(private readonly db: any) {}
  /**
   * 创建弹窗配置
   */
  async createPopupConfig(data: Omit<NewPopupConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<PopupConfig> {
    try {
      const [config] = await this.db
        .insert(popupConfigs)
        .values({
          ...data,
          updatedAt: new Date(),
        })
        .returning();

      console.log('✅ [PopupConfigService] 弹窗配置创建成功:', config.id);
      return config;
    } catch (error) {
      console.error('❌ [PopupConfigService] 创建弹窗配置失败:', error);
      throw new Error('创建弹窗配置失败');
    }
  }

  /**
   * 根据ID获取弹窗配置
   */
  async getPopupConfigById(id: string): Promise<PopupConfig | null> {
    try {
      const [config] = await this.db
        .select()
        .from(popupConfigs)
        .where(eq(popupConfigs.id, id))
        .limit(1);

      return config || null;
    } catch (error) {
      console.error('❌ [PopupConfigService] 获取弹窗配置失败:', error);
      throw new Error('获取弹窗配置失败');
    }
  }

  /**
   * 获取指定业务场景的启用弹窗配置
   */
  async getEnabledPopupConfigs(
    businessModule: string = 'showmasterpiece',
    businessScene: string = 'cart_checkout'
  ): Promise<PopupConfig[]> {
    try {
      // 构建查询条件
      const conditions = [
        eq(popupConfigs.enabled, true),
        eq(popupConfigs.businessModule, businessModule),
        eq(popupConfigs.businessScene, businessScene)
      ];
      
      const configs = await this.db
        .select()
        .from(popupConfigs)
        .where(and(...conditions))
        .orderBy(desc(popupConfigs.sortOrder), desc(popupConfigs.createdAt));

      console.log(`📊 [PopupConfigService] 获取到 ${configs.length} 个启用的弹窗配置`);
      return configs;
    } catch (error) {
      console.error('❌ [PopupConfigService] 获取启用弹窗配置失败:', error);
      throw new Error('获取启用弹窗配置失败');
    }
  }

  /**
   * 获取所有弹窗配置
   */
  async getAllPopupConfigs(): Promise<PopupConfig[]> {
    try {
      const configs = await this.db
        .select()
        .from(popupConfigs)
        .orderBy(desc(popupConfigs.createdAt));

      console.log(`📊 [PopupConfigService] 获取弹窗配置: 返回${configs.length}个配置`);
      return configs;
    } catch (error) {
      console.error('❌ [PopupConfigService] 获取所有弹窗配置失败:', error);
      throw new Error('获取所有弹窗配置失败');
    }
  }

  /**
   * 更新弹窗配置
   */
  async updatePopupConfig(id: string, data: Partial<Omit<PopupConfig, 'id' | 'createdAt'>>): Promise<PopupConfig> {
    try {
      const [config] = await this.db
        .update(popupConfigs)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(popupConfigs.id, id))
        .returning();

      if (!config) {
        throw new Error('弹窗配置不存在');
      }

      console.log('✅ [PopupConfigService] 弹窗配置更新成功:', config.id);
      return config;
    } catch (error) {
      console.error('❌ [PopupConfigService] 更新弹窗配置失败:', error);
      throw new Error('更新弹窗配置失败');
    }
  }

  /**
   * 删除弹窗配置
   */
  async deletePopupConfig(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(popupConfigs)
        .where(eq(popupConfigs.id, id));

      console.log('✅ [PopupConfigService] 弹窗配置删除成功:', id);
      return true;
    } catch (error) {
      console.error('❌ [PopupConfigService] 删除弹窗配置失败:', error);
      throw new Error('删除弹窗配置失败');
    }
  }

  /**
   * 切换弹窗配置启用状态
   */
  async togglePopupConfig(id: string, enabled: boolean): Promise<PopupConfig> {
    try {
      const [config] = await this.db
        .update(popupConfigs)
        .set({
          enabled,
          updatedAt: new Date(),
        })
        .where(eq(popupConfigs.id, id))
        .returning();

      if (!config) {
        throw new Error('弹窗配置不存在');
      }

      console.log(`✅ [PopupConfigService] 弹窗配置${enabled ? '启用' : '禁用'}成功:`, config.id);
      return config;
    } catch (error) {
      console.error('❌ [PopupConfigService] 切换弹窗配置状态失败:', error);
      throw new Error('切换弹窗配置状态失败');
    }
  }

  /**
   * 检查是否需要显示弹窗
   */
  async shouldShowPopup(
    businessModule: string = 'showmasterpiece',
    businessScene: string = 'cart_checkout',
    currentTime: Date = new Date()
  ): Promise<PopupConfig[]> {
    try {
      const enabledConfigs = await this.getEnabledPopupConfigs(businessModule, businessScene);
      const triggeredConfigs: PopupConfig[] = [];

      for (const config of enabledConfigs) {
        const { triggerConfig } = config;
        
        if (triggerConfig.triggerType === 'always') {
          triggeredConfigs.push(config);
          continue;
        }

        if (triggerConfig.deadlineTime) {
          const deadlineTime = new Date(triggerConfig.deadlineTime);
          const timeDiff = deadlineTime.getTime() - currentTime.getTime();
          const minutesDiff = Math.floor(timeDiff / (1000 * 60));

          switch (triggerConfig.triggerType) {
            case 'after_deadline':
              if (currentTime > deadlineTime) {
                triggeredConfigs.push(config);
              }
              break;
            case 'before_deadline':
              if (triggerConfig.advanceMinutes && minutesDiff <= triggerConfig.advanceMinutes && minutesDiff > 0) {
                triggeredConfigs.push(config);
              }
              break;
          }
        }
      }

      console.log(`🔔 [PopupConfigService] 检查到 ${triggeredConfigs.length} 个需要显示的弹窗`);
      return triggeredConfigs;
    } catch (error) {
      console.error('❌ [PopupConfigService] 检查弹窗显示条件失败:', error);
      return [];
    }
  }
}

// 导出单例实例


export function createPopupConfigService(db: any): PopupConfigService {
  return new PopupConfigService(db);
}
