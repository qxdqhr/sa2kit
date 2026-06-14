import { launchApp } from '../core/launcher';
import type { AppLaunchCallbacks, AppLaunchOptions, AppLaunchResult } from '../types';

/** 地图导航提供方（关键词导航场景） */
export type MapNavigationProviderId = 'amap' | 'baidu' | 'google';

export type MapNavigationOption = {
  id: MapNavigationProviderId;
  label: string;
  description?: string;
};

export const MAP_NAVIGATION_OPTIONS: readonly MapNavigationOption[] = [
  { id: 'amap', label: '高德地图', description: '国内常用，支持关键词导航' },
  { id: 'baidu', label: '百度地图', description: '国内常用，支持关键词导航' },
  { id: 'google', label: '谷歌地图', description: '海外或已安装 Google Maps 时适用' },
] as const;

export type MapNavigationOptions = AppLaunchOptions & {
  callbacks?: AppLaunchCallbacks;
};

export async function launchMapNavigation(
  provider: MapNavigationProviderId,
  destination: string,
  options?: MapNavigationOptions,
): Promise<AppLaunchResult> {
  const { callbacks, ...launchOptions } = options ?? {};
  return launchApp({
    provider,
    action: 'navigate',
    params: { destination },
    options: launchOptions,
    callbacks,
  });
}

/** 同步唤起，结果通过 callbacks 回传 */
export function openMapNavigation(
  provider: MapNavigationProviderId,
  destination: string,
  options?: MapNavigationOptions,
): void {
  void launchMapNavigation(provider, destination, options);
}
