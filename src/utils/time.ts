/**
 * 时间格式化工具
 */

export const formatTime = {
  /**
   * 将秒数转换为 MM:SS 格式
   */
  toMinutesSeconds(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  /**
   * 将秒数转换为 HH:MM:SS 格式
   */
  toHoursMinutesSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  /**
   * 格式化日期为用户友好的格式
   */
  formatDate(date: string | Date, locale = 'zh-CN'): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return locale === 'zh-CN' ? '今天' : 'Today';
    } else if (diffDays === 1) {
      return locale === 'zh-CN' ? '昨天' : 'Yesterday';
    } else if (diffDays < 7) {
      return locale === 'zh-CN' ? `${diffDays}天前` : `${diffDays} days ago`;
    } else {
      return d.toLocaleDateString(locale);
    }
  },
};

