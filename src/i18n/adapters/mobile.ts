/**
 * React Native 平台适配器
 * 用于 React Native 应用的语言检测和存储
 */

import type { Locale, I18nAdapter } from '../types';

/**
 * React Native 平台适配器
 * 使用 AsyncStorage 存储语言偏好
 *
 * 注意：需要安装 @react-native-async-storage/async-storage
 */
export class ReactNativeI18nAdapter implements I18nAdapter {
  private storageKey = '@app_locale';

  getSystemLocale(): Locale {
    // 需要导入 react-native 的 Platform 和 NativeModules
    try {
      // @ts-ignore - react-native 在运行时动态加载
      const { Platform, NativeModules } = require('react-native');
      const locale =
        Platform.OS === 'ios'
          ? NativeModules.SettingsManager.settings.AppleLocale ||
            NativeModules.SettingsManager.settings.AppleLanguages[0]
          : NativeModules.I18nManager.localeIdentifier;

      return this.normalizeLocale(locale);
    } catch {
      return 'zh-CN';
    }
  }

  async saveLocale(locale: Locale): Promise<void> {
    try {
      // @ts-ignore - AsyncStorage 在运行时动态加载
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(this.storageKey, locale);
    } catch (error) {
      console.error('Failed to save locale:', error);
    }
  }

  async loadLocale(): Promise<Locale | null> {
    try {
      // @ts-ignore - AsyncStorage 在运行时动态加载
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem(this.storageKey);
      return stored as Locale | null;
    } catch (error) {
      console.error('Failed to load locale:', error);
      return null;
    }
  }

  private normalizeLocale(locale: string): Locale {
    const map: Record<string, Locale> = {
      'zh-CN': 'zh-CN',
      zh_CN: 'zh-CN',
      'zh-Hans': 'zh-CN',
      zh_Hans_CN: 'zh-CN',
      'zh-TW': 'zh-TW',
      zh_TW: 'zh-TW',
      'zh-Hant': 'zh-TW',
      zh_Hant_TW: 'zh-TW',
      'en-US': 'en-US',
      en_US: 'en-US',
      en: 'en-US',
      'ja-JP': 'ja-JP',
      ja_JP: 'ja-JP',
      ja: 'ja-JP',
    };
    return map[locale] || 'zh-CN';
  }
}

