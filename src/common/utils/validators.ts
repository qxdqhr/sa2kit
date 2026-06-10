/**
 * 验证工具
 */

export const validators = {
  /**
   * 验证邮箱格式
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * 验证密码强度
   */
  isValidPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (password.length > 50) {
      errors.push('Password must not exceed 50 characters');
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * 验证用户名格式
   */
  isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  },

  /**
   * 验证文件大小
   */
  isValidFileSize(size: number, maxSize: number): boolean {
    return size > 0 && size <= maxSize;
  },

  /**
   * 验证文件类型
   */
  isValidFileType(type: string, supportedTypes: string[]): boolean {
    return supportedTypes.includes(type);
  },

  /**
   * 验证 URL 格式
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};

