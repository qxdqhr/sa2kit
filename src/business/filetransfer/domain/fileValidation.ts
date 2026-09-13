/**
* 文件验证工具函数
*/

/**
* 验证文件大小
*/
export function validateFileSize(fileSize: number, maxSize: number): boolean {
return fileSize > 0 && fileSize <= maxSize;
}

/**
* 验证文件类型
*/
export function validateFileType(fileType: string, allowedTypes: string[]): boolean {
if (!fileType || !allowedTypes || allowedTypes.length === 0) {
return false;
}

return allowedTypes.includes(fileType);
}

/**
* 获取文件扩展名
*/
export function getFileExtension(fileName: string): string {
const lastDotIndex = fileName.lastIndexOf('.');
return lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';
}

/**
* 验证文件名
*/
export function validateFileName(fileName: string): boolean {
// 检查文件名长度
if (!fileName || fileName.length === 0 || fileName.length > 255) {
return false;
}

// 检查危险字符
const dangerousChars = /[<>:"/\\|?*]/;
if (dangerousChars.test(fileName)) {
return false;
}

// 检查是否以点开头或结尾
if (fileName.startsWith('.') || fileName.endsWith('.')) {
return false;
}

return true;
}

/**
* 格式化文件大小显示
*/
export function formatFileSize(bytes: number): string {
if (bytes === 0) return '0 B';

const k = 1024;
const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
const i = Math.floor(Math.log(bytes) / Math.log(k));

return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}