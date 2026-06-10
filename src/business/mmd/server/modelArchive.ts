import AdmZip from 'adm-zip';
import { randomUUID } from 'crypto';
import { mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';

export type SupportedModelFormat = 'pmx' | 'pmd';

export interface ProcessMmdModelArchiveOptions {
  /**
   * 绝对路径，指向模型解压根目录，例如 /app/uploads/mmd/models
   */
  storageRoot: string;
  /**
   * 对外暴露的公共路径前缀，例如 /uploads/mmd/models
   * 默认与 storageRoot 中的叶子目录一致
   */
  publicRoot?: string;
  /**
   * 自定义文件夹名称，默认使用随机 UUID
   */
  folderName?: string;
}

export interface ProcessMmdModelArchiveResult {
  /** 解压出来的目录（绝对路径） */
  directory: string;
  /** 与 storageRoot 相对的目录名 */
  relativeDirectory: string;
  /** 模型文件相对目录（包含子目录） */
  modelRelativePath: string;
  /** 可供前端使用的模型 URL */
  modelUrl: string;
  /** 模型格式 */
  format: SupportedModelFormat;
  /** 解压得到的文件数量 */
  filesExtracted: number;
}

export const MMD_MODEL_ARCHIVE_MIME_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'multipart/x-zip',
] as const;

/**
 * 解析上传的 MMD 模型压缩包，保留目录结构并返回模型路径
 */
export async function processMmdModelArchive(
  buffer: Buffer,
  options: ProcessMmdModelArchiveOptions,
): Promise<ProcessMmdModelArchiveResult> {
  const folderName = options.folderName ?? randomUUID();
  const targetDir = path.join(options.storageRoot, folderName);
  await mkdir(targetDir, { recursive: true });

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  if (!entries.length) {
    await rm(targetDir, { recursive: true, force: true });
    throw new Error('压缩包为空，请检查上传文件内容');
  }

  let modelRelativePath: string | null = null;
  let filesExtracted = 0;

  for (const entry of entries) {
    if (!entry.entryName || entry.entryName.startsWith('__MACOSX') || entry.entryName.endsWith('.DS_Store')) {
      continue;
    }

    const safeRelativePath = sanitizeEntryPath(entry.entryName);
    if (!safeRelativePath) {
      continue;
    }

    const destinationPath = path.join(targetDir, safeRelativePath);

    if (entry.isDirectory) {
      await mkdir(destinationPath, { recursive: true });
      continue;
    }

    await mkdir(path.dirname(destinationPath), { recursive: true });
    await writeFile(destinationPath, entry.getData());
    filesExtracted += 1;

    const entryExt = path.extname(safeRelativePath).toLowerCase();
    if (!modelRelativePath && (entryExt === '.pmx' || entryExt === '.pmd')) {
      modelRelativePath = safeRelativePath.split(path.sep).join('/');
    }
  }

  if (!modelRelativePath) {
    await rm(targetDir, { recursive: true, force: true });
    throw new Error('压缩包中未找到 PMX/PMD 模型文件，请确认目录结构是否正确');
  }

  const format = path.extname(modelRelativePath).slice(1).toLowerCase() as SupportedModelFormat;
  const publicRoot = options.publicRoot ?? `/uploads/mmd/models`;
  const modelUrl = joinPublicPath(publicRoot, folderName, modelRelativePath);

  return {
    directory: targetDir,
    relativeDirectory: folderName,
    modelRelativePath,
    modelUrl,
    format,
    filesExtracted,
  };
}

function sanitizeEntryPath(entryName: string): string | null {
  const normalized = path.normalize(entryName).replace(/^(\.\.(\/|\\|$))+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('..') || path.isAbsolute(normalized)) {
    return null;
  }
  return normalized;
}

function joinPublicPath(...segments: string[]) {
  return segments
    .map((segment) => segment.replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, ''))
    .filter(Boolean)
    .join('/')
    .replace(/\/{2,}/g, '/')
    .replace(/^/, '/');
}

