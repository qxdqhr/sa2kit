/**
 * 日语文本处理工具
 */

export const japaneseUtils = {
  /**
   * 提取文本中的汉字
   */
  extractKanji(text: string): string[] {
    return text.match(/[\u4E00-\u9FAF]/g) || [];
  },

  /**
   * 提取文本中的假名
   */
  extractKana(text: string): string[] {
    return text.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || [];
  },

  /**
   * 清理文本，移除特殊字符但保留日语字符
   */
  cleanText(text: string): string {
    return text.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s]/g, '');
  },
};
