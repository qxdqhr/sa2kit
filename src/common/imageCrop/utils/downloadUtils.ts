/**
 * 下载工具函数
 * Download Utilities
 */

import JSZip from 'jszip';
import type { CropResult } from '../types';

/**
 * 创建ZIP压缩包并下载
 */
export async function downloadAsZip(
  results: CropResult[],
  zipFilename: string = 'cropped_images.zip'
): Promise<void> {
  if (results.length === 0) {
    throw new Error('没有可下载的图片');
  }

  const zip = new JSZip();
  
  // 添加所有裁剪结果到ZIP
  results.forEach((result, idx) => {
    const filename = result.filename || 'crop_' + (idx) + '.png';
    zip.file(filename, result.blob);
  });

  // 生成ZIP文件
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });

  // 触发下载
  downloadBlob(zipBlob, zipFilename);
}

/**
 * 下载单个Blob文件
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 释放URL对象
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * 批量下载多个文件（不压缩）
 */
export async function downloadMultipleFiles(
  results: CropResult[],
  delay: number = 100
): Promise<void> {
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (!result) continue;
    
    const filename = result.filename || 'crop_' + (i) + '.png';
    downloadBlob(result.blob, filename);
    
    // 添加延迟避免浏览器阻止多个下载
    if (i < results.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * 计算压缩包大小
 */
export function calculateTotalSize(results: CropResult[]): number {
  return results.reduce((total, result) => total + result.blob.size, 0);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return ((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + (sizes[i]);
}






