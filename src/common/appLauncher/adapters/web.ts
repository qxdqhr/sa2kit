import { isMobileDevice } from '../detect';
import type {
  AppLaunchAdapter,
  AppLaunchPlatform,
  AppLaunchResult,
  AppLaunchStatus,
  AppLaunchUrls,
  LaunchExecutionOptions,
} from '../types';

function dispatchCallbacks(
  options: LaunchExecutionOptions,
  result: AppLaunchResult,
): void {
  const { callbacks } = options;
  if (!callbacks) {
    return;
  }

  switch (result.status) {
    case 'opened':
      callbacks.onOpened?.(result);
      break;
    case 'fallback':
      callbacks.onFallback?.(result);
      break;
    case 'unavailable':
    case 'timeout':
    case 'cancelled':
      callbacks.onUnavailable?.(result);
      break;
    default:
      break;
  }
}

function openUrl(url: string, mobile: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (mobile) {
    window.location.assign(url);
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

function waitForAppOpen(timeoutMs: number): Promise<AppLaunchStatus> {
  return new Promise(resolve => {
    if (typeof document === 'undefined') {
      resolve('opened');
      return;
    }

    let settled = false;
    const finish = (status: AppLaunchStatus) => {
      if (settled) {
        return;
      }
      settled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearTimeout(timer);
      resolve(status);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        finish('opened');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    const timer = window.setTimeout(() => finish('timeout'), timeoutMs);
  });
}

export function createWebAppLaunchAdapter(): AppLaunchAdapter {
  const platform: AppLaunchPlatform = 'web';

  return {
    platform,

    async launch(urls, options): Promise<AppLaunchResult> {
      const mobile = isMobileDevice();
      const baseResult = {
        provider: options.provider,
        action: options.action,
        platform,
      } satisfies Pick<AppLaunchResult, 'provider' | 'action' | 'platform'>;

      openUrl(urls.primary, mobile);

      if (mobile) {
        const status = await waitForAppOpen(options.timeoutMs);
        if (status === 'opened') {
          const result: AppLaunchResult = {
            ...baseResult,
            status: 'opened',
            url: urls.primary,
          };
          dispatchCallbacks(options, result);
          return result;
        }

        if (urls.fallback) {
          openUrl(urls.fallback, true);
          const result: AppLaunchResult = {
            ...baseResult,
            status: 'fallback',
            url: urls.fallback,
          };
          dispatchCallbacks(options, result);
          return result;
        }

        const result: AppLaunchResult = {
          ...baseResult,
          status: 'timeout',
          url: urls.primary,
        };
        dispatchCallbacks(options, result);
        return result;
      }

      const result: AppLaunchResult = {
        ...baseResult,
        status: 'opened',
        url: urls.primary,
      };
      dispatchCallbacks(options, result);
      return result;
    },
  };
}
