/**
 * @package sa2kit/common/platform
 *
 * 跨平台运行时适配（storage / fetch / filePick）
 */
export type {
  PlatformAdapter,
  PlatformId,
  FilePickAdapter,
  FilePickOptions,
  PickedFile,
} from './types';

export {
  createWebPlatformAdapter,
  createTaroPlatformAdapter,
  createElectronPlatformAdapter,
  createNodeHonoPlatformAdapter,
} from './adapters';
