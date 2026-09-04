/**
 * ShowMasterpiece 文件服务 — 委托 sa2kit/common/file，避免重复 OSS 配置与上传逻辑。
 */
export {
  uploadArtworkImage,
  getArtworkImageUrl,
  uploadModuleFile,
  getModuleFileAccessUrl,
  universalFileClient,
  createFileClient,
} from 'sa2kit/common/file/client';

import {
  shouldUseOssFileService,
  getOssStorageModeDisplayName,
  clearOssFileConfigCache,
  refreshOssFileConfigCache,
} from 'sa2kit/common/file/client';

function getShowmasterpieceItemsApiUrl(): string {
  const environment =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
      ? 'production'
      : 'development';
  return `/api/showmasterpiece/config/items?environment=${environment}`;
}

export async function shouldUseUniversalFileService(): Promise<boolean> {
  return shouldUseOssFileService(getShowmasterpieceItemsApiUrl());
}

export async function getStorageModeDisplayName(): Promise<string> {
  return getOssStorageModeDisplayName(getShowmasterpieceItemsApiUrl());
}

export function clearConfigCache(): void {
  clearOssFileConfigCache();
}

export async function refreshFileServiceConfig() {
  await refreshOssFileConfigCache(getShowmasterpieceItemsApiUrl());
}
