import AdmZip from 'adm-zip';
import { uploadFileAndResolveAccessUrl, type FileDbService } from 'sa2kit/common/file/server';
import type { SkillSource, SkillStatus } from '../domain/types';

const MODULE_ID = 'skill-manager';

type RawFile = {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  moduleId: string;
  businessId: string;
  cdnUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | Date | null;
};

export type SkillStoredFile = {
  id: string;
  skillId: string;
  relativePath: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type SkillManagerFileStoreConfig = {
  createFileDbService: () => FileDbService | Promise<FileDbService>;
  createFileService: () => Promise<Parameters<typeof uploadFileAndResolveAccessUrl>[0]>;
  getFileUrl: (fileId: string) => Promise<string | null | undefined>;
};

function toIso(value: string | Date | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function deriveRelativePath(file: RawFile): string {
  const fromMeta = typeof file.metadata?.relativePath === 'string' ? file.metadata.relativePath.trim() : '';
  if (fromMeta) return fromMeta;
  const prefix = `${MODULE_ID}/${file.businessId}/`;
  if (file.storagePath?.includes(prefix)) {
    return file.storagePath.slice(file.storagePath.indexOf(prefix) + prefix.length);
  }
  return file.originalName;
}

function normalizeSource(source: unknown): SkillSource {
  return source === 'local_cursor' || source === 'manual_upload' || source === 'remote' ? source : 'manual_upload';
}

function normalizeStatus(status: unknown): SkillStatus {
  return status === 'draft' || status === 'published' || status === 'archived' ? status : 'draft';
}

export function readMeta(file: SkillStoredFile): { source: SkillSource; status: SkillStatus } {
  return {
    source: normalizeSource(file.metadata?.source),
    status: normalizeStatus(file.metadata?.status),
  };
}

export function createSkillManagerFileStore(config: SkillManagerFileStoreConfig) {
  async function queryModuleFiles(offset: number, limit: number): Promise<RawFile[]> {
    const fileDbService = await config.createFileDbService();
    const result = await fileDbService.getFiles({
      moduleId: MODULE_ID,
      isDeleted: false,
      limit,
      offset,
    });
    return (result?.files || []) as RawFile[];
  }

  async function listSkillIds(): Promise<string[]> {
    const ids = new Set<string>();
    let offset = 0;
    const pageSize = 200;

    while (true) {
      const batch = await queryModuleFiles(offset, pageSize);
      if (!batch.length) break;
      for (const file of batch) {
        if (file.businessId) ids.add(file.businessId);
      }
      if (batch.length < pageSize) break;
      offset += pageSize;
    }

    return Array.from(ids);
  }

  async function listSkillFiles(skillId: string): Promise<SkillStoredFile[]> {
    const fileDbService = await config.createFileDbService();
    const result = await fileDbService.getFiles({
      moduleId: MODULE_ID,
      businessId: skillId,
      isDeleted: false,
      limit: 1000,
      offset: 0,
    });
    const files = (result?.files || []) as RawFile[];
    const latestByPath = new Map<string, SkillStoredFile>();
    for (const raw of files) {
      const item: SkillStoredFile = {
        id: raw.id,
        skillId: raw.businessId,
        relativePath: deriveRelativePath(raw),
        originalName: raw.originalName,
        mimeType: raw.mimeType,
        size: raw.size,
        createdAt: toIso(raw.createdAt),
        metadata: (raw.metadata || {}) as Record<string, unknown>,
      };
      const prev = latestByPath.get(item.relativePath);
      if (!prev || prev.createdAt < item.createdAt) {
        latestByPath.set(item.relativePath, item);
      }
    }
    return Array.from(latestByPath.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async function getSkillFileByRelativePath(skillId: string, relativePath: string): Promise<SkillStoredFile | null> {
    const files = await listSkillFiles(skillId);
    return files.find((f) => f.relativePath === relativePath) || null;
  }

  async function getFileAccessUrl(fileId: string): Promise<string> {
    const url = await config.getFileUrl(fileId);
    if (!url) {
      throw new Error(`无法解析文件 URL: ${fileId}`);
    }
    return url;
  }

  async function readTextFileById(fileId: string): Promise<string> {
    const url = await getFileAccessUrl(fileId);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`读取文件失败: ${response.status}`);
    }
    return response.text();
  }

  async function uploadSkillFile(input: {
    skillId: string;
    relativePath: string;
    content: string;
    source: SkillSource;
    status: SkillStatus;
    uploaderId?: string;
  }): Promise<{ fileId: string; accessUrl: string }> {
    const fileService = await config.createFileService();
    const name = input.relativePath.split('/').pop() || 'SKILL.md';
    const file = new File([input.content], name, { type: 'text/markdown' });
    return uploadFileAndResolveAccessUrl(
      fileService,
      {
        file,
        moduleId: MODULE_ID,
        businessId: input.skillId,
        customPath: `${MODULE_ID}/${input.skillId}/${input.relativePath}`,
        metadata: {
          relativePath: input.relativePath,
          source: input.source,
          status: input.status,
          uploadedBy: input.uploaderId || 'unknown',
          uploadedAt: new Date().toISOString(),
        },
      },
      input.uploaderId,
    );
  }

  async function buildSkillZip(skillId: string): Promise<Buffer> {
    const files = await listSkillFiles(skillId);
    const zip = new AdmZip();
    for (const file of files) {
      const url = await getFileAccessUrl(file.id);
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) continue;
      const bytes = await response.arrayBuffer();
      zip.addFile(file.relativePath, Buffer.from(bytes));
    }
    return zip.toBuffer();
  }

  async function buildBatchZip(skillIds: string[]): Promise<Buffer> {
    const zip = new AdmZip();
    for (const skillId of skillIds) {
      const files = await listSkillFiles(skillId);
      for (const file of files) {
        const url = await getFileAccessUrl(file.id);
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) continue;
        const bytes = await response.arrayBuffer();
        zip.addFile(`${skillId}/${file.relativePath}`, Buffer.from(bytes));
      }
    }
    return zip.toBuffer();
  }

  return {
    listSkillIds,
    listSkillFiles,
    getSkillFileByRelativePath,
    readTextFileById,
    uploadSkillFile,
    buildSkillZip,
    buildBatchZip,
    readMeta,
  };
}

export type SkillManagerFileStore = ReturnType<typeof createSkillManagerFileStore>;
