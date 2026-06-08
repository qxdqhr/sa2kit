export interface BuildModuleUploadPathOptions {
  moduleId: string;
  businessId?: string;
  fileName: string;
  subfolder?: string;
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
