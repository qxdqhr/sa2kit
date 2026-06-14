/** 支持的第三方 App 提供方 */
export type AppProviderId = 'amap' | 'baidu' | 'google' | 'wechat' | 'qq' | 'generic';

/** 运行平台 */
export type AppLaunchPlatform = 'web' | 'rn';

/** 唤起结果状态 */
export type AppLaunchStatus =
  | 'opened'
  | 'fallback'
  | 'unavailable'
  | 'cancelled'
  | 'timeout';

export type AppLaunchUrls = {
  /** 优先尝试的 scheme / URI */
  primary: string;
  /** 无法唤起 App 时的降级链接（通常为 https://uri.* 网页版） */
  fallback?: string;
};

export type AppLaunchResult = {
  provider: AppProviderId;
  action: string;
  status: AppLaunchStatus;
  url: string;
  platform: AppLaunchPlatform;
  data?: Record<string, unknown>;
};

export class AppLaunchError extends Error {
  readonly code:
    | 'UNKNOWN_PROVIDER'
    | 'UNKNOWN_ACTION'
    | 'INVALID_PARAMS'
    | 'ADAPTER_MISSING'
    | 'OPEN_FAILED';

  readonly details?: Record<string, unknown>;

  constructor(
    code: AppLaunchError['code'],
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppLaunchError';
    this.code = code;
    this.details = details;
  }
}

export type AppReturnPayload = {
  provider?: AppProviderId;
  action?: string;
  url: string;
  params: Record<string, string>;
  raw?: unknown;
};

export type AppLaunchCallbacks = {
  /** 已成功尝试唤起（Web 端通过页面隐藏等方式推断） */
  onOpened?: (result: AppLaunchResult) => void;
  /** 使用了 fallback 链接 */
  onFallback?: (result: AppLaunchResult) => void;
  /** 无法唤起目标 App */
  onUnavailable?: (result: AppLaunchResult) => void;
  /** 第三方 App 通过 returnUrl / deep link 回传 */
  onReturn?: (payload: AppReturnPayload) => void;
  /** 任意错误 */
  onError?: (error: AppLaunchError) => void;
};

export type AppLaunchOptions = {
  /** 第三方统计用的来源应用名，如 profile-v1 */
  sourceApplication?: string;
  /** 自定义 fallback，覆盖 provider 默认值 */
  fallbackUrl?: string;
  /** 回跳地址（如 myapp://launch/callback），供宿主监听 */
  returnUrl?: string;
  /** Web 端等待 App 唤起的超时（毫秒） */
  timeoutMs?: number;
};

export type AppLaunchRequest = {
  provider: AppProviderId;
  action: string;
  params?: Record<string, unknown>;
  options?: AppLaunchOptions;
  callbacks?: AppLaunchCallbacks;
  /** 单次调用可覆盖全局 adapter */
  adapter?: AppLaunchAdapter;
};

export type LaunchExecutionOptions = {
  timeoutMs: number;
  callbacks?: AppLaunchCallbacks;
  provider: AppProviderId;
  action: string;
};

/** 平台适配器：负责实际 openURL 与结果推断 */
export type AppLaunchAdapter = {
  platform: AppLaunchPlatform;
  launch(urls: AppLaunchUrls, options: LaunchExecutionOptions): Promise<AppLaunchResult>;
  canOpen?(url: string): Promise<boolean>;
};

export type AppLauncherConfig = {
  sourceApplication: string;
  adapter?: AppLaunchAdapter;
  defaultOptions?: AppLaunchOptions;
  defaultCallbacks?: AppLaunchCallbacks;
};

export type AppLaunchProviderContext = {
  sourceApplication: string;
  options: AppLaunchOptions;
};

/** 各子功能（高德/微信/QQ 等）的统一契约 */
export type AppLaunchProvider = {
  id: AppProviderId;
  actions: readonly string[];
  buildUrls(
    action: string,
    params: Record<string, unknown>,
    context: AppLaunchProviderContext,
  ): AppLaunchUrls;
  validateParams?(
    action: string,
    params: Record<string, unknown>,
  ): void;
};
