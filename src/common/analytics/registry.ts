import type { Analytics } from './core/Analytics';

const DEFAULT_ID = 'default';

const registry = new Map<string, Analytics>();

/**
 * 注册 Analytics 实例（R2-234，替代 globalThis.__analytics__）
 */
export function registerAnalytics(analytics: Analytics, id = DEFAULT_ID): void {
  registry.set(id, analytics);
}

export function getRegisteredAnalytics(id = DEFAULT_ID): Analytics | null {
  return registry.get(id) ?? null;
}

export function unregisterAnalytics(id = DEFAULT_ID): void {
  registry.delete(id);
}

export function clearAnalyticsRegistry(): void {
  registry.clear();
}

/** @deprecated 使用 registerAnalytics */
export function setGlobalAnalytics(analytics: Analytics): void {
  registerAnalytics(analytics);
}

/** @deprecated 使用 getRegisteredAnalytics */
export function getGlobalAnalytics(): Analytics | null {
  return getRegisteredAnalytics();
}
