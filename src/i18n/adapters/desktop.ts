/**
 * Electron 平台适配器
 * 用于 Electron 桌面应用的语言检测和存储
 */

import type { Locale, I18nAdapter } from '../types';

/**
 * Electron 平台适配器
 * 使用 localStorage 存储语言偏好
 *
 * 注意：Electron 渲染进程支持 Web API
 */
export class ElectronI18nAdapter implements I18nAdapter {
  private storageKey = 'app_locale';

  getSystemLocale(): Locale {
    if (typeof navigator === 'undefined') return 'zh-CN';
    const browserLocale = navigator.language;
    return this.normalizeLocale(browserLocale);
  }

  async saveLocale(locale: Locale): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.storageKey, locale);
  }

  async loadLocale(): Promise<Locale | null> {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(this.storageKey);
    return stored as Locale | null;
  }

  private normalizeLocale(locale: string): Locale {
    const map: Record<string, Locale> = {
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'zh-HK': 'zh-TW',
      zh: 'zh-CN',
      'en-US': 'en-US',
      'en-GB': 'en-US',
      en: 'en-US',
      'ja-JP': 'ja-JP',
      ja: 'ja-JP',
    };
    return map[locale] || 'zh-CN';
  }
}

