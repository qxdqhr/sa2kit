export class DietUploadError extends Error {
  constructor(
    message: string,
    readonly code: 'OSS_NOT_CONFIGURED' | 'INVALID_URL' | 'UPLOAD_FAILED',
  ) {
    super(message);
    this.name = 'DietUploadError';
  }
}

export type DietUploadResult = { imageUrl: string; fileId: string };

export type DietUploader = (input: {
  file: File;
  userId: string | number;
}) => Promise<DietUploadResult>;
