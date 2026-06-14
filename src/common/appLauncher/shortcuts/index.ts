import { launchApp } from '../core/launcher';
import { buildAmapNavigationUrl } from '../providers/amap';
import { buildBaiduNavigationUrl } from '../providers/baidu';
import { buildGoogleNavigationUrl } from '../providers/google';
import type { AppLaunchCallbacks, AppLaunchOptions, AppLaunchResult } from '../types';

export type AmapNavigationOptions = AppLaunchOptions & {
  callbacks?: AppLaunchCallbacks;
};

/** 高德关键词导航（日历等场景：仅地点文本） */
export async function launchAmapNavigation(
  destination: string,
  options?: AmapNavigationOptions,
): Promise<AppLaunchResult> {
  const { callbacks, ...launchOptions } = options ?? {};
  return launchApp({
    provider: 'amap',
    action: 'navigate',
    params: { destination },
    options: launchOptions,
    callbacks,
  });
}

/** 兼容同步调用：不阻塞 UI，结果通过 callbacks 回传 */
export function openAmapNavigation(
  destination: string,
  options?: AmapNavigationOptions,
): void {
  void launchAmapNavigation(destination, options);
}

export { buildAmapNavigationUrl };

export type WechatShareOptions = AppLaunchOptions & {
  callbacks?: AppLaunchCallbacks;
  title: string;
  description?: string;
  url: string;
  thumbUrl?: string;
};

export async function launchWechatShare(
  options: WechatShareOptions,
): Promise<AppLaunchResult> {
  const { callbacks, title, description, url, thumbUrl, ...launchOptions } = options;
  return launchApp({
    provider: 'wechat',
    action: 'share',
    params: { title, description, url, thumbUrl },
    options: launchOptions,
    callbacks,
  });
}

export type QqShareOptions = AppLaunchOptions & {
  callbacks?: AppLaunchCallbacks;
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
};

export async function launchQqShare(options: QqShareOptions): Promise<AppLaunchResult> {
  const { callbacks, title, summary, url, imageUrl, ...launchOptions } = options;
  return launchApp({
    provider: 'qq',
    action: 'share',
    params: { title, summary, url, imageUrl },
    options: launchOptions,
    callbacks,
  });
}

export async function launchGenericUrl(
  url: string,
  options?: AppLaunchOptions & { callbacks?: AppLaunchCallbacks; fallback?: string },
): Promise<AppLaunchResult> {
  const { callbacks, fallback, ...launchOptions } = options ?? {};
  return launchApp({
    provider: 'generic',
    action: 'open',
    params: { url, fallback },
    options: launchOptions,
    callbacks,
  });
}

export {
  MAP_NAVIGATION_OPTIONS,
  launchMapNavigation,
  openMapNavigation,
  type MapNavigationOption,
  type MapNavigationOptions,
  type MapNavigationProviderId,
} from './map-navigation';

export { buildBaiduNavigationUrl } from '../providers/baidu';
export { buildGoogleNavigationUrl } from '../providers/google';
