/**
 * 图片裁剪相关类型定义
 */

export interface GridConfig {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
}

export interface GridCell {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropResult {
  blob: Blob;
  dataUrl: string;
  index: number;
  row: number;
  col: number;
}

export interface ImageInfo {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}

export interface CropOptions {
  quality?: number;
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
}

export interface ExportOptions extends CropOptions {
  filename?: string;
  zipFilename?: string;
}

export interface ImageGridCropperConfig {
  defaultRows?: number;
  defaultCols?: number;
  minRows?: number;
  maxRows?: number;
  minCols?: number;
  maxCols?: number;
}

export interface ImageGridCropperProps extends ImageGridCropperConfig {
  imageSrc: string;
  onCrop?: (results: CropResult[]) => void;
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
