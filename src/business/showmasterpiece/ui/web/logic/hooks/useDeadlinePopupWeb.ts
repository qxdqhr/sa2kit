/**
 * ShowMasterpiece 模块 - 限时弹窗Hook
 * 
 * 管理限时弹窗的显示逻辑
 * 
 * @fileoverview 限时弹窗Hook
 */

'use client';

import { useCallback } from 'react';
import { useDeadlinePopupCore } from '../shared/useDeadlinePopupCore';

/**
 * 限时弹窗Hook
 */
export function useDeadlinePopup(
  businessModule: string = 'showmasterpiece',
  businessScene: string = 'cart_checkout'
) {
  const fetchPopupConfigs = useCallback(
    async ({
      businessModule: moduleName,
      businessScene: sceneName,
      currentTime,
    }: {
      businessModule: string;
      businessScene: string;
      currentTime: string;
    }) => {
      const response = await fetch('/api/showmasterpiece/popup-configs/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessModule: moduleName,
          businessScene: sceneName,
          currentTime,
        }),
      });

      if (!response.ok) {
        throw new Error('检查弹窗配置失败');
      }

      const result = await response.json();
      return result.configs || [];
    },
    [],
  );

  return useDeadlinePopupCore({
    businessModule,
    businessScene,
    fetchPopupConfigs,
  });
}

export default useDeadlinePopup;
