import type { PlatformAdapter } from '../types';

/**
 * Taro 小程序 adapter 骨架（R2-222）
 *
 * 宿主需传入已初始化的 Taro storage / request 实现。
 */
export function createTaroPlatformAdapter(partial: PlatformAdapter): PlatformAdapter {
  if (!partial.storage || !partial.fetch) {
    throw new Error(
      '[PlatformAdapter:taro] 请注入 storage 与 fetch（基于 Taro.getStorage / Taro.request）',
    );
  }
  return {
    storage: partial.storage,
    fetch: partial.fetch,
    filePick: partial.filePick,
  };
}
