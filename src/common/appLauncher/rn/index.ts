/**
 * React Native 宿主集成
 *
 * @example
 * ```ts
 * import { Linking } from 'react-native';
 * import {
 *   configureAppLauncher,
 *   createRnAppLaunchAdapter,
 *   setupRnAppReturnListener,
 * } from 'sa2kit/common/appLauncher/rn';
 *
 * configureAppLauncher({
 *   sourceApplication: 'my-rn-app',
 *   adapter: createRnAppLaunchAdapter(Linking),
 * });
 *
 * setupRnAppReturnListener(Linking, {
 *   returnUrlPrefix: 'myapp://launch/',
 *   onReturn: payload => console.log(payload),
 * });
 * ```
 */
export {
  configureAppLauncher,
  createRnAppLaunchAdapter,
  createRnAppLaunchAdapterFromReactNative,
  getAppLauncherConfig,
  launchApp,
  launchAmapNavigation,
  launchGenericUrl,
  launchQqShare,
  launchWechatShare,
  notifyAppReturn,
  parseReturnUrl,
  registerAppProvider,
  subscribeAppReturn,
  type AppLaunchCallbacks,
  type AppLaunchOptions,
  type AppLaunchResult,
  type AppReturnPayload,
  type RnLinkingLike,
} from '../index';

import {
  matchesReturnUrl,
  notifyAppReturn,
  parseReturnUrl,
} from '../core/return-handler';
import type { AppReturnPayload } from '../types';
import type { RnLinkingLike } from '../adapters/rn';

export type RnReturnListenerOptions = {
  returnUrlPrefix?: string;
  onReturn: (payload: AppReturnPayload) => void;
};

/** 监听 RN Linking 回跳并转发给 appLauncher 订阅者 */
export function setupRnAppReturnListener(
  linking: RnLinkingLike,
  options: RnReturnListenerOptions,
): () => void {
  const handler = (event: { url: string }) => {
    const { returnUrlPrefix, onReturn } = options;
    if (returnUrlPrefix && !event.url.startsWith(returnUrlPrefix)) {
      return;
    }
    const payload = parseReturnUrl(event.url);
    onReturn(payload);
    notifyAppReturn(payload);
  };

  linking.addEventListener?.('url', handler);

  if (linking.getInitialURL) {
    void linking.getInitialURL().then(url => {
      if (url) {
        handler({ url });
      }
    });
  }

  return () => {
    linking.removeEventListener?.('url', handler);
  };
}

export { matchesReturnUrl };
