/**
 * @package sa2kit/common/file
 *
 * 2.0 文件能力 SSOT：优先使用 ossFile；universalFile 客户端保留兼容导出。
 */
export * from '../ossFile';
export {
  UniversalFileClient,
  universalFileClient,
  createFileClient,
} from '../universalFile/client';
export type * from '../universalFile/types';
