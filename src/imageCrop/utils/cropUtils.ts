/**
 * 图片裁剪工具函数
 * Image Cropping Utilities
 */

import type { GridCell, ImageInfo, CropResult, CropOptions } from '../types';

/**
 * 从文件加载图片
 */
export async function loadImageFromFile(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      
      img.onload = () => {
        resolve({
          file,
          dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          image: img,
        });
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      img.src = dataUrl;
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 裁剪单个网格单元格
 */
export async function cropGridCell(
  imageInfo: ImageInfo,
  cell: GridCell,
  cellWidth: number,
  cellHeight: number,
  options: CropOptions = {}
): Promise<CropResult> {
  const {
    format = 'image/png',
    quality = 0.92,
    filenamePrefix = 'crop',
  } = options;

  // 创建离屏canvas
  const canvas = document.createElement('canvas');
  canvas.width = cellWidth;
  canvas.height = cellHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context 创建失败');
  }

  // 计算源图片裁剪区域
  const sourceX = cell.offsetX;
  const sourceY = cell.offsetY;
  const sourceWidth = cellWidth;
  const sourceHeight = cellHeight;

  // 绘制裁剪区域
  ctx.drawImage(
    imageInfo.image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    cellWidth,
    cellHeight
  );

  // 转换为Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('图片转换失败'));
        }
      },
      format,
      quality
    );
  });

  // 生成文件名
  const extension = format.split('/')[1];
  const filename = `${filenamePrefix}_r${cell.row}_c${cell.column}.${extension}`;

  return {
    cell,
    blob,
    filename,
  };
}

/**
 * 批量裁剪多个网格单元格
 */
export async function cropMultipleCells(
  imageInfo: ImageInfo,
  cells: GridCell[],
  cellWidth: number,
  cellHeight: number,
  options: CropOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<CropResult[]> {
  const results: CropResult[] = [];
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (!cell || !cell.selected) continue;
    
    try {
      const result = await cropGridCell(imageInfo, cell, cellWidth, cellHeight, options);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, cells.length);
      }
    } catch (error) {
      console.error(`裁剪单元格 (${cell.row}, ${cell.column}) 失败:`, error);
    }
  }
  
  return results;
}

/**
 * 生成网格单元格预览
 */
export async function generateCellPreview(
  imageInfo: ImageInfo,
  cell: GridCell,
  cellWidth: number,
  cellHeight: number,
  previewSize: number = 100
): Promise<string> {
  const canvas = document.createElement('canvas');
  const scale = Math.min(previewSize / cellWidth, previewSize / cellHeight);
  
  canvas.width = cellWidth * scale;
  canvas.height = cellHeight * scale;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context 创建失败');
  }

  ctx.drawImage(
    imageInfo.image,
    cell.offsetX,
    cell.offsetY,
    cellWidth,
    cellHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL('image/png');
}

/**
 * 验证裁剪区域是否在图片范围内
 */
export function validateCropArea(
  imageWidth: number,
  imageHeight: number,
  offsetX: number,
  offsetY: number,
  cropWidth: number,
  cropHeight: number
): boolean {
  return (
    offsetX >= 0 &&
    offsetY >= 0 &&
    offsetX + cropWidth <= imageWidth &&
    offsetY + cropHeight <= imageHeight
  );
}

/**
 * 自动调整偏移量以保持在图片范围内
 */
export function constrainOffset(
  imageWidth: number,
  imageHeight: number,
  offsetX: number,
  offsetY: number,
  cropWidth: number,
  cropHeight: number
): { offsetX: number; offsetY: number } {
  const constrainedX = Math.max(0, Math.min(offsetX, imageWidth - cropWidth));
  const constrainedY = Math.max(0, Math.min(offsetY, imageHeight - cropHeight));
  
  return {
    offsetX: constrainedX,
    offsetY: constrainedY,
  };
}



