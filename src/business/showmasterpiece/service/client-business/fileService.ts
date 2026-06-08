/**
 * ShowMasterpiece 文件服务 — 委托 sa2kit/common/file（ossFile）
 * @deprecated 业务将迁出 sa2kit；请使用 profile-v1 本地模块或 sa2kit/common/file
 */
export {
  uploadArtworkImage,
  getArtworkImageUrl,
  uploadModuleFile,
  getModuleFileAccessUrl,
  shouldUseUniversalFileService,
  getStorageModeDisplayName,
  clearConfigCache,
  refreshFileServiceConfig,
} from '../../../../common/file';
