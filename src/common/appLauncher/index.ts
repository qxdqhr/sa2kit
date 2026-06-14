import {
  createRnAppLaunchAdapter,
  createRnAppLaunchAdapterFromReactNative,
  type RnLinkingLike,
} from './adapters/rn';
import { createWebAppLaunchAdapter } from './adapters/web';
import {
  configureAppLauncher,
  getAppLauncherConfig,
  resetAppLauncherConfig,
} from './core/config';
import { launchApp } from './core/launcher';
import {
  matchesReturnUrl,
  notifyAppReturn,
  parseReturnUrl,
  subscribeAppReturn,
} from './core/return-handler';
import { isAndroid, isIOS, isMobileDevice } from './detect';
import {
  amapProvider,
  genericProvider,
  getAppProvider,
  listAppProviders,
  qqProvider,
  registerAppProvider,
  wechatProvider,
} from './providers/registry';
import {
  buildAmapNavigationUrl,
  launchAmapNavigation,
  launchGenericUrl,
  launchQqShare,
  launchWechatShare,
  openAmapNavigation,
} from './shortcuts';

export type {
  AppLaunchAdapter,
  AppLaunchCallbacks,
  AppLaunchOptions,
  AppLaunchPlatform,
  AppLaunchProvider,
  AppLaunchRequest,
  AppLaunchResult,
  AppLaunchStatus,
  AppLaunchUrls,
  AppLauncherConfig,
  AppProviderId,
  AppReturnPayload,
  LaunchExecutionOptions,
} from './types';

export { AppLaunchError } from './types';

export {
  launchApp,
  configureAppLauncher,
  getAppLauncherConfig,
  resetAppLauncherConfig,
  registerAppProvider,
  getAppProvider,
  listAppProviders,
  amapProvider,
  wechatProvider,
  qqProvider,
  genericProvider,
  createWebAppLaunchAdapter,
  createRnAppLaunchAdapter,
  createRnAppLaunchAdapterFromReactNative,
  parseReturnUrl,
  notifyAppReturn,
  subscribeAppReturn,
  matchesReturnUrl,
  isAndroid,
  isIOS,
  isMobileDevice,
  buildAmapNavigationUrl,
  launchAmapNavigation,
  openAmapNavigation,
  launchWechatShare,
  launchQqShare,
  launchGenericUrl,
};

export type { RnLinkingLike } from './adapters/rn';
export type { AmapNavigationOptions, QqShareOptions, WechatShareOptions } from './shortcuts';
