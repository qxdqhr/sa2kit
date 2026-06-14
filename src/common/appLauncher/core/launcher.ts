import { createWebAppLaunchAdapter } from '../adapters/web';
import { getAppLauncherConfig } from './config';
import { getAppProvider } from '../providers/registry';
import {
  AppLaunchError,
  type AppLaunchAdapter,
  type AppLaunchRequest,
  type AppLaunchResult,
} from '../types';

function resolveAdapter(request: AppLaunchRequest): AppLaunchAdapter {
  const config = getAppLauncherConfig();
  const adapter = request.adapter ?? config.adapter;

  if (adapter) {
    return adapter;
  }

  if (typeof window !== 'undefined') {
    return createWebAppLaunchAdapter();
  }

  throw new AppLaunchError(
    'ADAPTER_MISSING',
    '未配置 AppLaunchAdapter，请在宿主启动时调用 configureAppLauncher({ adapter })',
  );
}

/**
 * 统一唤起入口：按 provider + action 构建 scheme，经平台 adapter 拉起第三方 App。
 */
export async function launchApp(request: AppLaunchRequest): Promise<AppLaunchResult> {
  const config = getAppLauncherConfig();
  const provider = getAppProvider(request.provider);

  if (!provider) {
    throw new AppLaunchError('UNKNOWN_PROVIDER', `未知 provider: ${request.provider}`);
  }

  if (!provider.actions.includes(request.action)) {
    throw new AppLaunchError(
      'UNKNOWN_ACTION',
      `provider "${request.provider}" 不支持 action "${request.action}"`,
      { supportedActions: [...provider.actions] },
    );
  }

  const params = request.params ?? {};
  provider.validateParams?.(request.action, params);

  const mergedOptions = {
    sourceApplication: config.sourceApplication,
    timeoutMs: 1500,
    ...config.defaultOptions,
    ...request.options,
  };

  const urls = provider.buildUrls(request.action, params, {
    sourceApplication: mergedOptions.sourceApplication ?? config.sourceApplication,
    options: mergedOptions,
  });

  if (mergedOptions.fallbackUrl && !urls.fallback) {
    urls.fallback = mergedOptions.fallbackUrl;
  }

  const adapter = resolveAdapter(request);
  const callbacks = {
    ...config.defaultCallbacks,
    ...request.callbacks,
  };

  try {
    return await adapter.launch(urls, {
      provider: request.provider,
      action: request.action,
      timeoutMs: mergedOptions.timeoutMs ?? 1500,
      callbacks,
    });
  } catch (error) {
    const launchError =
      error instanceof AppLaunchError
        ? error
        : new AppLaunchError(
            'OPEN_FAILED',
            error instanceof Error ? error.message : '唤起第三方 App 失败',
          );
    callbacks.onError?.(launchError);
    throw launchError;
  }
}
