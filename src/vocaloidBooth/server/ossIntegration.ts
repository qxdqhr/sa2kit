import type { UniversalFileService } from '../../universalFile/server';
import type { AccessPermission, UploadProgress } from '../../universalFile/types';
import type { BoothFileKind, CreateBoothUploadInput, CreateBoothUploadResult } from '../types';
import { BoothVaultService } from '../core';
import { validateUploadFiles } from './security';

export interface BoothIncomingFile {
  file: File;
  kind?: BoothFileKind;
}

export interface CreateBoothUploadWithOSSInput {
  boothId: string;
  files: BoothIncomingFile[];
  metadata?: CreateBoothUploadInput['metadata'];
  ttlHours?: number;
  moduleId?: string;
  businessId?: string;
  permission?: AccessPermission;
  onProgress?: (fileName: string, progress: UploadProgress) => void;
}

export const uploadToOSSAndCreateBoothRecord = async (
  params: CreateBoothUploadWithOSSInput,
  deps: {
    fileService: UniversalFileService;
    vaultService: BoothVaultService;
  }
): Promise<CreateBoothUploadResult> => {
  validateUploadFiles(
    params.files.map((item) => ({ fileName: item.file.name, size: item.file.size })),
    {
      maxFiles: 20,
      maxSingleFileSizeBytes: 2 * 1024 * 1024 * 1024,
      maxTotalSizeBytes: 5 * 1024 * 1024 * 1024,
    }
  );

  const moduleId = params.moduleId ?? 'vocaloid-booth';
  const businessId = params.businessId ?? params.boothId;
  const permission = params.permission ?? 'private';

  const uploaded = await Promise.all(
    params.files.map(async (item) => {
      const metadata = await deps.fileService.uploadFile(
        {
          file: item.file,
          moduleId,
          businessId,
          permission,
          metadata: {
            boothId: params.boothId,
            kind: item.kind ?? 'other',
          },
        },
        undefined,
        (progress) => params.onProgress?.(item.file.name, progress)
      );

      return {
        fileName: metadata.originalName,
        size: metadata.size,
        mimeType: metadata.mimeType,
        checksum: metadata.hash,
        objectKey: metadata.storagePath,
        kind: item.kind ?? 'other',
      };
    })
  );

  return deps.vaultService.createUpload({
    boothId: params.boothId,
    ttlHours: params.ttlHours,
    metadata: params.metadata,
    files: uploaded,
  });
};
