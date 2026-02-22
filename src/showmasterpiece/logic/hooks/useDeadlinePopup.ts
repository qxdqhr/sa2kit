/**
 * ShowMasterpiece 模块 - 限时弹窗Hook
 * 
 * 管理限时弹窗的显示逻辑
 * 
 * @fileoverview 限时弹窗Hook
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PopupConfig } from '../../types/popup';

/**
 * 弹窗显示状态
 */
interface PopupDisplayState {
  /** 需要显示的弹窗配置 */
  configs: PopupConfig[];
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否有弹窗显示 */
  hasPopup: boolean;
}

/**
 * 限时弹窗Hook
 */
export function useDeadlinePopup(
  businessModule: string = 'showmasterpiece',
  businessScene: string = 'cart_checkout'
) {
  const [state, setState] = useState<PopupDisplayState>({
    configs: [],
    loading: false,
    error: null,
    hasPopup: false,
  });

  const [dismissedPopups, setDismissedPopups] = useState<Set<string>>(new Set());

  /**
   * 检查是否需要显示弹窗
   */
  const checkPopups = useCallback(async (currentTime?: Date) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/showmasterpiece/popup-configs/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessModule,
          businessScene,
          currentTime: (currentTime || new Date()).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('检查弹窗配置失败');
      }

      const result = await response.json();
      const configs: PopupConfig[] = result.configs || [];
      
      // 过滤掉已经被用户关闭的弹窗
      const activeConfigs = configs.filter(config => !dismissedPopups.has(config.id));

      setState(prev => ({
        ...prev,
        configs: activeConfigs,
        loading: false,
        hasPopup: activeConfigs.length > 0,
      }));

      console.log(`🔔 [useDeadlinePopup] 检查到 ${activeConfigs.length} 个需要显示的弹窗`);
      
      return activeConfigs;
    } catch (error) {
      console.error('❌ [useDeadlinePopup] 检查弹窗失败:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '检查弹窗失败',
        configs: [],
        hasPopup: false,
      }));
      return [];
    }
  }, [businessModule, businessScene, dismissedPopups]);

  /**
   * 关闭弹窗
   */
  const closePopup = useCallback((configId: string) => {
    setDismissedPopups(prev => new Set([...prev, configId]));
    setState(prev => {
      const remainingConfigs = prev.configs.filter(config => config.id !== configId);
      return {
        ...prev,
        configs: remainingConfigs,
        hasPopup: remainingConfigs.length > 0,
      };
    });
    
    console.log(`✅ [useDeadlinePopup] 弹窗已关闭:`, configId);
  }, []);

  /**
   * 确认弹窗
   */
  const confirmPopup = useCallback((configId: string) => {
    console.log(`✅ [useDeadlinePopup] 弹窗已确认:`, configId);
    closePopup(configId);
  }, [closePopup]);

  /**
   * 取消弹窗
   */
  const cancelPopup = useCallback((configId: string) => {
    console.log(`❌ [useDeadlinePopup] 弹窗已取消:`, configId);
    closePopup(configId);
  }, [closePopup]);

  /**
   * 临时关闭弹窗（用于阻断类型弹窗，不添加到dismissedPopups）
   */
  const temporaryClosePopup = useCallback((configId: string) => {
    setState(prev => {
      const remainingConfigs = prev.configs.filter(config => config.id !== configId);
      return {
        ...prev,
        configs: remainingConfigs,
        hasPopup: remainingConfigs.length > 0,
      };
    });
    
    console.log(`⏸️ [useDeadlinePopup] 弹窗临时关闭:`, configId);
  }, []);

  /**
   * 重置已关闭的弹窗记录
   */
  const resetDismissedPopups = useCallback(() => {
    setDismissedPopups(new Set());
    console.log('🔄 [useDeadlinePopup] 已重置弹窗关闭记录');
  }, []);

  /**
   * 手动触发弹窗检查（用于购物车提交时）
   * 强制重新检查，不受dismissedPopups影响
   */
  const triggerCheck = useCallback(async (currentTime?: Date) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/showmasterpiece/popup-configs/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessModule,
          businessScene,
          currentTime: (currentTime || new Date()).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('检查弹窗配置失败');
      }

      const result = await response.json();
      const configs: PopupConfig[] = result.configs || [];
      
      // 对于手动触发检查，我们需要区分阻断弹窗和提醒弹窗
      // 阻断弹窗：不受dismissedPopups影响，总是检查
      // 提醒弹窗：受dismissedPopups影响，避免重复显示
      const activeConfigs = configs.filter(config => {
        if (config.blockProcess) {
          // 阻断弹窗：总是显示，不受dismissedPopups影响
          return true;
        } else {
          // 提醒弹窗：检查是否已被用户关闭
          return !dismissedPopups.has(config.id);
        }
      });

      setState(prev => ({
        ...prev,
        configs: activeConfigs,
        loading: false,
        hasPopup: activeConfigs.length > 0,
      }));

      console.log(`🔔 [useDeadlinePopup] 手动检查到 ${activeConfigs.length} 个需要显示的弹窗（阻断弹窗不受dismissedPopups限制）`);
      
      return activeConfigs;
    } catch (error) {
      console.error('❌ [useDeadlinePopup] 手动检查弹窗失败:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '检查弹窗失败',
        configs: [],
        hasPopup: false,
      }));
      return [];
    }
  }, [businessModule, businessScene, dismissedPopups]);

  return {
    ...state,
    checkPopups,
    closePopup,
    confirmPopup,
    cancelPopup,
    temporaryClosePopup,
    resetDismissedPopups,
    triggerCheck,
  };
}

export default useDeadlinePopup;
