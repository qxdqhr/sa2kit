/**
 * 图片裁剪相关类型定义
 */

export interface CropConfig {
  rows: number;
  cols: number;
}

export interface CropResult {
  blob: Blob;
  dataUrl: string;
  index: number;
}

export interface ImageGridCropperProps {
  imageSrc: string;
  onCrop?: (results: CropResult[]) => void;
  defaultRows?: number;
  defaultCols?: number;
  className?: string;
}

export interface GridControlsProps {
  rows: number;
  cols: number;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
  onCrop: () => void;
  onDownloadAll: () => void;
  className?: string;
}
