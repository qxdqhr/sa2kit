import type { AppLaunchProvider, AppProviderId } from '../types';
import { amapProvider } from './amap';
import { baiduProvider } from './baidu';
import { genericProvider } from './generic';
import { googleProvider } from './google';
import { qqProvider } from './qq';
import { wechatProvider } from './wechat';

const builtinProviders: Record<AppProviderId, AppLaunchProvider> = {
  amap: amapProvider,
  baidu: baiduProvider,
  google: googleProvider,
  wechat: wechatProvider,
  qq: qqProvider,
  generic: genericProvider,
};

const customProviders = new Map<AppProviderId, AppLaunchProvider>();

export function registerAppProvider(provider: AppLaunchProvider): void {
  customProviders.set(provider.id, provider);
}

export function getAppProvider(id: AppProviderId): AppLaunchProvider | undefined {
  return customProviders.get(id) ?? builtinProviders[id];
}

export function listAppProviders(): AppProviderId[] {
  const ids = new Set<AppProviderId>([
    ...(Object.keys(builtinProviders) as AppProviderId[]),
    ...customProviders.keys(),
  ]);
  return [...ids];
}

export { amapProvider, baiduProvider, googleProvider, wechatProvider, qqProvider, genericProvider };
