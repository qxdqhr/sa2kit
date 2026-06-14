import type { AppLauncherConfig } from '../types';

const defaultConfig: AppLauncherConfig = {
  sourceApplication: 'sa2kit',
};

let runtimeConfig: AppLauncherConfig = { ...defaultConfig };

export function configureAppLauncher(patch: Partial<AppLauncherConfig>): AppLauncherConfig {
  runtimeConfig = {
    ...runtimeConfig,
    ...patch,
    defaultOptions: {
      ...runtimeConfig.defaultOptions,
      ...patch.defaultOptions,
    },
    defaultCallbacks: {
      ...runtimeConfig.defaultCallbacks,
      ...patch.defaultCallbacks,
    },
  };
  return getAppLauncherConfig();
}

export function getAppLauncherConfig(): AppLauncherConfig {
  return runtimeConfig;
}

export function resetAppLauncherConfig(): void {
  runtimeConfig = { ...defaultConfig };
}
