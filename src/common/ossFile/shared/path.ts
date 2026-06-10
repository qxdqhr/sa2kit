export interface BuildModuleUploadPathOptions {
  moduleId: string;
  businessId?: string;
  fileName: string;
  subfolder?: string;
}

export interface ResolveUploadFolderPathOptions {
  moduleId: string;
  businessId?: string;
  fileName: string;
  /** 优先于 customPath；与 API FormData 字段一致 */
  folderPath?: string | null;
  /** universalFile UploadFileInfo.customPath 别名 */
  customPath?: string | null;
}

/**
 * 统一 folderPath / customPath 解析（R2-204）。
 * client 与 server 均应使用此函数，避免双端路径不一致。
 */
export function resolveUploadFolderPath(
  options: ResolveUploadFolderPathOptions,
): string {
  for (const candidate of [options.folderPath, options.customPath]) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return buildModuleUploadPath({
    moduleId: options.moduleId,
    businessId: options.businessId,
    fileName: options.fileName,
  });
}

/**
 * 从 multipart FormData 解析上传路径（兼容 folderPath 与 customPath）。
 */
export function resolveUploadFolderPathFromFormData(
  formData: FormData,
  defaults: Pick<ResolveUploadFolderPathOptions, 'moduleId' | 'businessId' | 'fileName'>,
): string {
  const folderPath = formData.get('folderPath');
  const customPath = formData.get('customPath');
  return resolveUploadFolderPath({
    ...defaults,
    folderPath: typeof folderPath === 'string' ? folderPath : undefined,
    customPath: typeof customPath === 'string' ? customPath : undefined,
  });
}

/**
 * 生成 OSS / universal-file 使用的 folderPath（含扩展名）。
 */
export function buildModuleUploadPath(options: BuildModuleUploadPathOptions): string {
  const extension = options.fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 11);
  const segments = [
    options.moduleId,
    options.businessId,
    options.subfolder,
  ].filter(Boolean);
  const base = segments.length > 0 ? segments.join('/') : options.moduleId;
  return `${base}/${timestamp}_${randomId}.${extension}`;
}
