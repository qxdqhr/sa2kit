/**
 * Taro (小程序) 平台适配器
 * 用于微信小程序、支付宝小程序等通过 Taro 开发的应用
 */

import type { Locale, I18nAdapter } from '../types';

/**
 * Taro (小程序) 平台适配器
 * 使用 Taro.storage API 存储语言偏好
 *
 * 注意：需要安装 @tarojs/taro
 */
export class TaroI18nAdapter implements I18nAdapter {
  private storageKey = 'app_locale';

  getSystemLocale(): Locale {
    try {
      // @ts-ignore - Taro 在运行时动态加载
      const Taro = require('@tarojs/taro').default;
      const systemInfo = Taro.getSystemInfoSync();
      return this.normalizeLocale(systemInfo.language);
    } catch {
      return 'zh-CN';
    }
  }

  async saveLocale(locale: Locale): Promise<void> {
    try {
      // @ts-ignore - Taro 在运行时动态加载
      const Taro = require('@tarojs/taro').default;
      await Taro.setStorage({
        key: this.storageKey,
        data: locale,
      });
    } catch (error) {
      console.error('Failed to save locale:', error);
    }
  }

  async loadLocale(): Promise<Locale | null> {
    try {
      // @ts-ignore - Taro 在运行时动态加载
      const Taro = require('@tarojs/taro').default;
      const res = await Taro.getStorage({
        key: this.storageKey,
      });
      return res.data as Locale | null;
    } catch (error) {
      return null;
    }
  }

  private normalizeLocale(locale: string): Locale {
    const map: Record<string, Locale> = {
      zh_CN: 'zh-CN',
      'zh-CN': 'zh-CN',
      zh_TW: 'zh-TW',
      'zh-TW': 'zh-TW',
      en: 'en-US',
      'en-US': 'en-US',
      ja: 'ja-JP',
      'ja-JP': 'ja-JP',
    };
    return map[locale] || 'zh-CN';
  }
}

