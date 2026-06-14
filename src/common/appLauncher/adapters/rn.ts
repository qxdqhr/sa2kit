import type {
  AppLaunchAdapter,
  AppLaunchPlatform,
  AppLaunchResult,
  LaunchExecutionOptions,
} from '../types';

/** RN Linking 最小能力面，避免硬依赖 react-native */
export type RnLinkingLike = {
  canOpenURL(url: string): Promise<boolean>;
  openURL(url: string): Promise<void>;
  addEventListener?: (
    type: 'url',
    handler: (event: { url: string }) => void,
  ) => void;
  removeEventListener?: (
    type: 'url',
    handler: (event: { url: string }) => void,
  ) => void;
  getInitialURL?: () => Promise<string | null>;
};

export function createRnAppLaunchAdapter(linking: RnLinkingLike): AppLaunchAdapter {
  const platform: AppLaunchPlatform = 'rn';

  return {
    platform,

    async canOpen(url: string): Promise<boolean> {
      try {
        return await linking.canOpenURL(url);
      } catch {
        return false;
      }
    },

    async launch(urls, options: LaunchExecutionOptions): Promise<AppLaunchResult> {
      const baseResult = {
        provider: options.provider,
        action: options.action,
        platform,
      } satisfies Pick<AppLaunchResult, 'provider' | 'action' | 'platform'>;

      const tryOpen = async (url: string) => {
        const canOpen = await linking.canOpenURL(url).catch(() => false);
        if (!canOpen) {
          return false;
        }
        await linking.openURL(url);
        return true;
      };

      if (await tryOpen(urls.primary)) {
        const result: AppLaunchResult = {
          ...baseResult,
          status: 'opened',
          url: urls.primary,
        };
        options.callbacks?.onOpened?.(result);
        return result;
      }

      if (urls.fallback && (await tryOpen(urls.fallback))) {
        const result: AppLaunchResult = {
          ...baseResult,
          status: 'fallback',
          url: urls.fallback,
        };
        options.callbacks?.onFallback?.(result);
        return result;
      }

      const result: AppLaunchResult = {
        ...baseResult,
        status: 'unavailable',
        url: urls.primary,
      };
      options.callbacks?.onUnavailable?.(result);
      return result;
    },
  };
}

/**
 * 在已安装 react-native 的宿主中快捷创建 adapter。
 * 若未安装 react-native 将抛出明确错误。
 */
export function createRnAppLaunchAdapterFromReactNative(): AppLaunchAdapter {
  let linking: RnLinkingLike;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    linking = require('react-native').Linking as RnLinkingLike;
  } catch {
    throw new Error(
      '[appLauncher/rn] 未找到 react-native，请使用 createRnAppLaunchAdapter(linking) 手动注入 Linking',
    );
  }
  return createRnAppLaunchAdapter(linking);
}
