import { WebRequestAdapter } from '../../../request/adapters/web-adapter';
import { ElectronStorageAdapter } from '../../../storage/adapters/electron-adapter';
import { createWebPlatformAdapter } from './web';
import type { PlatformAdapter } from '../types';

/**
 * Electron 桌面 adapter 骨架（R2-222）
 *
 * 默认复用 Web fetch + Electron storage；filePick 回退 Web input。
 */
export function createElectronPlatformAdapter(
  options: { filePick?: boolean } = {},
): PlatformAdapter {
  try {
    return {
      storage: new ElectronStorageAdapter(),
      fetch: new WebRequestAdapter(),
      filePick:
        options.filePick === false
          ? undefined
          : createWebPlatformAdapter({ filePick: true }).filePick,
    };
  } catch {
    return createWebPlatformAdapter(options);
  }
}
