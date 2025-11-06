/**
 * 工具函数统一导出
 *
 * 已按功能模块拆分为独立文件：
 * - time.ts - 时间格式化工具
 * - japanese.ts - 日语文本处理工具
 * - validators.ts - 验证工具
 * - file.ts - 文件处理工具
 * - array.ts - 数组和对象工具
 * - string.ts - 字符串工具
 * - debug.ts - 调试工具
 * - error.ts - 错误处理工具
 */

// 时间格式化工具
export { formatTime } from './time';

// 日语文本处理工具
export { japaneseUtils } from './japanese';

// 验证工具
export { validators } from './validators';

// 文件处理工具
export { fileUtils } from './file';

// 数组和对象工具
export { arrayUtils } from './array';

// 字符串工具
export { stringUtils } from './string';

// 调试工具
export { debugUtils } from './debug';

// 错误处理工具
export { errorUtils } from './error';

