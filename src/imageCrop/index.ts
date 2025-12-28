/**
 * 图片网格裁剪工具模块
 * Image Grid Cropper Module
 * 
 * 提供网格式图片裁剪功能，支持自定义行列数和单元格尺寸
 * 可以裁剪固定大小的图片并导出为压缩包
 * 
 * @package sa2kit/imageCrop
 */

// ============= 组件导出 =============
export * from './components';

// ============= 类型导出 =============
export type {
  GridConfig,
  GridCell,
  CropResult,
  ImageInfo,
  CropOptions,
  ExportOptions,
  ImageGridCropperConfig,
} from './types';

// ============= 工具函数导出 =============
export {
  // 裁剪工具
  loadImageFromFile,
  cropGridCell,
  cropMultipleCells,
  generateCellPreview,
  validateCropArea,
  constrainOffset,
  
  // 下载工具
  downloadAsZip,
  downloadBlob,
  downloadMultipleFiles,
  calculateTotalSize,
  formatFileSize,
} from './utils';









