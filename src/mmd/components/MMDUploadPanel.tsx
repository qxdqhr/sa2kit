import React, { useId, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { clsx } from 'clsx';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import type {
  AccessPermission,
  FileMetadata,
  UploadFileInfo,
  UploadProgress
} from '../../universalFile/types';

export type MMDUploadResourceType =
  | 'model'
  | 'motion'
  | 'camera'
  | 'audio'
  | 'stage'
  | 'thumbnail';

export interface MMDUploadConfig {
  moduleId: string;
  acceptedTypes: string[];
  maxFileSize: number;
  description: string;
  hint?: string;
}

export const MMD_UPLOAD_CONFIGS: Record<MMDUploadResourceType, MMDUploadConfig> = {
  model: {
    moduleId: 'mmd-models',
    acceptedTypes: ['.zip'],
    maxFileSize: 150,
    description: 'MMD model package (ZIP)',
    hint: 'Include PMX/PMD and textures in the ZIP with original folder structure.'
  },
  motion: {
    moduleId: 'mmd-motions',
    acceptedTypes: ['.vmd'],
    maxFileSize: 20,
    description: 'MMD motion file'
  },
  camera: {
    moduleId: 'mmd-cameras',
    acceptedTypes: ['.vmd'],
    maxFileSize: 10,
    description: 'MMD camera motion'
  },
  audio: {
    moduleId: 'mmd-audios',
    acceptedTypes: ['.mp3', '.wav', '.ogg', '.m4a'],
    maxFileSize: 20,
    description: 'Audio track'
  },
  stage: {
    moduleId: 'mmd-stages',
    acceptedTypes: ['.zip'],
    maxFileSize: 200,
    description: 'Stage package (ZIP)',
    hint: 'Include stage model and textures in the ZIP with original folder structure.'
  },
  thumbnail: {
    moduleId: 'mmd-thumbnails',
    acceptedTypes: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSize: 5,
    description: 'Thumbnail image'
  }
};

export interface MMDUploadPanelProps {
  resourceType: MMDUploadResourceType;
  fileService: {
    uploadFile: (
      fileInfo: UploadFileInfo,
      onProgress?: (progress: UploadProgress) => void
    ) => Promise<FileMetadata>;
    getFileUrl?: (fileId: string, expiresIn?: number) => Promise<string>;
  };
  userId?: string;
  permission?: AccessPermission;
  label?: string;
  description?: string;
  hint?: string;
  acceptedTypes?: string[];
  maxFileSizeMB?: number;
  validateZip?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onUploaded?: (payload: { file: FileMetadata; url?: string }) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: UploadProgress) => void;
}

const formatMegabytes = (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`;

export const MMDUploadPanel: React.FC<MMDUploadPanelProps> = ({
  resourceType,
  fileService,
  userId,
  permission = 'public',
  label,
  description,
  hint,
  acceptedTypes,
  maxFileSizeMB,
  validateZip = true,
  disabled = false,
  className,
  style,
  onUploaded,
  onError,
  onProgress
}) => {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const config = MMD_UPLOAD_CONFIGS[resourceType];
  const mergedAcceptedTypes = acceptedTypes ?? config.acceptedTypes;
  const maxSize = maxFileSizeMB ?? config.maxFileSize;

  const hintText = hint ?? config.hint;
  const titleText = label ?? config.description;
  const descriptionText = description ?? `Max ${maxSize} MB`;

  const acceptAttr = useMemo(() => mergedAcceptedTypes.join(','), [mergedAcceptedTypes]);

  const validateZipContents = async (file: File) => {
    if (!validateZip || !(resourceType === 'model' || resourceType === 'stage')) return;
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const entries = Object.keys(zip.files);

    if (!entries.length) {
      throw new Error('ZIP is empty.');
    }

    const hasModel =
      entries.some((name) => /\.[pP][mM][xX]$/.test(name)) ||
      (resourceType === 'stage' && entries.some((name) => /\.[pP][mM][dD]$/.test(name)));

    const hasAssets = entries.some((name) =>
      /\.(png|jpg|jpeg|bmp|tga|dds|spa|sph)$/i.test(name)
    );

    if (!hasModel) {
      throw new Error('ZIP does not contain a PMX/PMD model file.');
    }

    if (!hasAssets) {
      throw new Error('ZIP does not include texture assets.');
    }
  };

  const handleUpload = async (file: File) => {
    if (disabled || uploading) return;

    setError(null);
    setProgress(null);

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize} MB.`);
      return;
    }

    try {
      setUploading(true);
      await validateZipContents(file);

      const fileInfo: UploadFileInfo = {
        file,
        moduleId: config.moduleId,
        businessId: userId,
        permission
      };

      const metadata = await fileService.uploadFile(fileInfo, (progressEvent) => {
        setProgress(progressEvent);
        onProgress?.(progressEvent);
      });

      let url: string | undefined;
      if (fileService.getFileUrl) {
        url = await fileService.getFileUrl(metadata.id);
        setUploadedUrl(url ?? null);
      } else {
        setUploadedUrl(null);
      }

      setUploadedFile(metadata);
      setUploading(false);
      onUploaded?.({ file: metadata, url });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      setError(message);
      setUploading(false);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className={clsx('space-y-4', className)} style={style}>
      <div>
        <div className="text-sm font-semibold text-gray-900">{titleText}</div>
        <div className="text-xs text-gray-500">{descriptionText}</div>
        {hintText && <div className="text-xs text-amber-600 mt-1">{hintText}</div>}
      </div>

      <div
        className={clsx(
          'rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          id={inputId}
          type="file"
          accept={acceptAttr}
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled || uploading}
        />
        <label htmlFor={inputId} className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-gray-500" />
          <span className="text-sm text-gray-600">
            Click to select or drag file here
          </span>
          <span className="text-xs text-gray-400">
            {mergedAcceptedTypes.join(', ')}
          </span>
        </label>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading{progress ? ` ${progress.progress}%` : '...'}
        </div>
      )}

      {progress && (
        <div className="text-xs text-gray-500">
          {formatMegabytes(progress.uploadedBytes)} / {formatMegabytes(progress.totalBytes)}
        </div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}

      {uploadedFile && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="truncate">{uploadedFile.originalName}</span>
          </div>
          {uploadedUrl && (
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-green-700 underline"
            >
              Open
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default MMDUploadPanel;
