import {
  configureAppLauncher,
  openAmapNavigation,
  buildAmapNavigationUrl,
  launchAmapNavigation,
  MAP_NAVIGATION_OPTIONS,
  launchMapNavigation,
  openMapNavigation,
  type AppLaunchCallbacks,
  type AppLaunchResult,
  type MapNavigationProviderId,
} from 'sa2kit/common/appLauncher';

configureAppLauncher({ sourceApplication: 'profile-v1' });

export {
  openAmapNavigation,
  buildAmapNavigationUrl,
  launchAmapNavigation,
  MAP_NAVIGATION_OPTIONS,
  launchMapNavigation,
  openMapNavigation,
  type AppLaunchCallbacks,
  type AppLaunchResult,
  type MapNavigationProviderId,
};
