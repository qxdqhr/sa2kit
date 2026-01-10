'use client';

/**
 * 配置缓存优化 Hook
 *
 * 使用 SWR 实现智能缓存和自动重新验证
 * 支持多平台：Web、React Native、小程序
 *
 * 优点：
 * 1. 自动缓存，减少网络请求
 * 2. 自动重新验证（可配置）
 * 3. 乐观更新
 * 4. 错误重试
 * 5. 防抖和去重
 */

import { default as useSWR, mutate } from 'swr';
import { useCallback } from 'react';
import type { AllConfigs, UseConfigsOptions, ConfigItem } from '../types';

export type { AllConfigs, UseConfigsOptions, ConfigItem };

/**
 * 创建 useConfigs Hook
 */
export function createUseConfigs(options: UseConfigsOptions) {
  const {
    apiBaseUrl = '',
    getAuthToken,
    onUnauthorized,
    dedupingInterval = 60000,
    revalidateOnFocus = false,
  } = options;

  // Fetcher 函数
  const fetcher = async (url: string) => {
    const token = await getAuthToken();

    const res = await fetch((apiBaseUrl) + (url), {
      headers: {
        Authorization: 'Bearer ' + (token),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 401) {
        onUnauthorized?.();
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch configs');
    }

    const data = await res.json();
    return data.data as AllConfigs;
  };

  // 返回 Hook 函数
  return function useConfigs() {
    const {
      data,
      error,
      mutate: mutateConfigs,
    } = useSWR<AllConfigs>('/api/admin/config', fetcher, {
      // 配置选项
      revalidateOnFocus,
      revalidateOnReconnect: true, // 网络重连时重新验证
      dedupingInterval, // 缓存去重时间
      errorRetryCount: 3, // 错误重试3次
      errorRetryInterval: 5000, // 重试间隔5秒
      shouldRetryOnError: true, // 启用错误重试

      // 成功时的回调
      onSuccess: (_data: AllConfigs) => {
        console.log('✅ Configs loaded from cache or network');
      },

      // 错误时的回调
      onError: (err: Error) => {
        console.error('❌ Failed to load configs:', err);
      },
    });

    // 更新配置（乐观更新）
    const updateConfigs = useCallback(
      async (category: string, updates: Record<string, any>) => {
        const token = await getAuthToken();

        // 乐观更新：立即更新本地缓存
        mutateConfigs(
          (current: AllConfigs | undefined) => {
            if (!current) return current;
            return {
              ...current,
              [category]: {
                ...current[category],
                ...Object.entries(updates).reduce((acc, [key, value]) => {
                  acc[key] = {
                    ...current[category]?.[key],
                    value,
                  };
                  return acc;
                }, {} as any),
              },
            };
          },
          false // 不立即重新验证
        );

        try {
          // 发送到服务器
          const res = await fetch((apiBaseUrl) + '/api/admin/config/' + (category), {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + (token),
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ configs: updates }),
          });

          if (!res.ok) throw new Error('Update failed');

          // 更新成功，重新验证缓存
          mutateConfigs();

          return { success: true };
        } catch (error) {
          // 更新失败，回滚
          mutateConfigs(); // 从服务器重新获取
          throw error;
        }
      },
      [mutateConfigs, getAuthToken, apiBaseUrl]
    );

    // 手动刷新
    const refresh = useCallback(() => {
      mutateConfigs();
    }, [mutateConfigs]);

    return {
      configs: data,
      isLoading: !error && !data,
      isError: !!error,
      error,
      updateConfigs,
      refresh,
    };
  };
}

/**
 * 预加载配置
 */
export function prefetchConfigs(apiBaseUrl: string = '') {
  mutate((apiBaseUrl) + '/api/admin/config');
}

/**
 * 全局缓存失效
 */
export function invalidateAllConfigs(apiBaseUrl: string = '') {
  mutate(
    (key: any) => typeof key === 'string' && key.startsWith((apiBaseUrl) + '/api/admin/config'),
    undefined,
    { revalidate: true }
  );
}

