/**
 * @package sa2kit/ossFile
 *
 * 基于 universalFile 的 OSS 文件上传 / 下载 / 删除统一入口。
 * 业务模块应优先使用本包，避免重复实现 OSS 配置与 FormData 上传逻辑。
 */

export type {
  UploadModuleFileOptions,
  UploadModuleFileResult,
  UniversalFileClientConfig,
  OssFileFetchFn,
  OssFileHttpConfig,
} from './client';

export {
  configureOssFileHttp,
  configureOssFileFromPlatform,
  createOssFileFetchFromAdapter,
  universalFileClient,
  createFileClient,
  uploadModuleFile,
  uploadArtworkImage,
  getModuleFileAccessUrl,
  getArtworkImageUrl,
  shouldUseOssFileService,
  getOssStorageModeDisplayName,
  clearOssFileConfigCache,
  refreshOssFileConfigCache,
  shouldUseUniversalFileService,
  getStorageModeDisplayName,
  clearConfigCache,
  refreshFileServiceConfig,
  buildModuleUploadPath,
  resolveUploadFolderPath,
  STANDARD_ALIYUN_OSS_KEYS,
  parseAliyunOssConfigFromMap,
} from './client';

export type * from '../universalFile/types';
