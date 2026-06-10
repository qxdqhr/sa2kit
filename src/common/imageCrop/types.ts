/**
 * 图片裁剪相关类型定义
 */

export interface GridConfig {
  rows: number;
  columns: number;
  cellWidth: number;
  cellHeight: number;
}

export interface GridCell {
  id: string;
  row: number;
  column: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  selected: boolean;
}

export interface CropResult {
  blob: Blob;
  dataUrl: string;
  index: number;
  row: number;
  column: number;
  cell: GridCell;
  filename?: string;
}

export interface ImageInfo {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  image?: HTMLImageElement;
  file?: File;
}

export interface CropOptions {
  quality?: number;
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
  filenamePrefix?: string;
}

export interface ExportOptions extends CropOptions {
  filename?: string;
  zipFilename?: string;
  cropOptions?: CropOptions;
}

export interface ImageGridCropperConfig {
  defaultRows?: number;
  defaultColumns?: number;
  defaultCellWidth?: number;
  defaultCellHeight?: number;
  minRows?: number;
  maxRows?: number;
  minColumns?: number;
  maxColumns?: number;
  maxCellSize?: number;
  minCellSize?: number;
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



