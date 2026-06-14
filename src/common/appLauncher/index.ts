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
  baiduProvider,
  genericProvider,
  getAppProvider,
  googleProvider,
  listAppProviders,
  qqProvider,
  registerAppProvider,
  wechatProvider,
} from './providers/registry';
import {
  buildAmapNavigationUrl,
  buildBaiduNavigationUrl,
  buildGoogleNavigationUrl,
  launchAmapNavigation,
  launchGenericUrl,
  launchMapNavigation,
  launchQqShare,
  launchWechatShare,
  MAP_NAVIGATION_OPTIONS,
  openAmapNavigation,
  openMapNavigation,
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
  baiduProvider,
  googleProvider,
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
  buildBaiduNavigationUrl,
  buildGoogleNavigationUrl,
  launchAmapNavigation,
  openAmapNavigation,
  launchWechatShare,
  launchQqShare,
  launchGenericUrl,
  MAP_NAVIGATION_OPTIONS,
  launchMapNavigation,
  openMapNavigation,
};

export type { RnLinkingLike } from './adapters/rn';
export type { AmapNavigationOptions, QqShareOptions, WechatShareOptions } from './shortcuts';
export type {
  MapNavigationOption,
  MapNavigationOptions,
  MapNavigationProviderId,
} from './shortcuts/map-navigation';
