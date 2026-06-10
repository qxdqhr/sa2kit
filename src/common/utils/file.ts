/**
 * 文件处理工具
 */

export const fileUtils = {
  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 获取文件扩展名
   */
  getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  },

  /**
   * 生成唯一文件名
   */
  generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = this.getFileExtension(originalName);
    const baseName = originalName.replace('.' + (extension), '');
    return extension ? (baseName) + '_' + (timestamp) + '_' + (random) + '.' + (extension) : (baseName) + '_' + (timestamp) + '_' + (random);
  },

  /**
   * 验证文件名是否有效
   */
  isValidFilename(filename: string): boolean {
    // 不允许包含特殊字符
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    return !invalidChars.test(filename) && filename.length > 0 && filename.length <= 255;
  },
};

