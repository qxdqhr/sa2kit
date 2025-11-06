'use client';

/**
 * 语言切换组件
 * 支持多种样式：按钮组、下拉菜单、图标按钮
 * 使用 Tailwind CSS 样式
 */

import React from 'react';
import { useTranslation } from '../hooks';
import type { Locale } from '../types';

// ==================== 类型定义 ====================

export interface LanguageSwitcherProps {
  variant?: 'buttons' | 'dropdown' | 'icon';
  className?: string;
  onLanguageChange?: (locale: Locale) => void;
}

export interface LanguageOption {
  locale: Locale;
  label: string;
  flag: string;
}

// ==================== 语言选项配置 ====================

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { locale: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { locale: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { locale: 'en-US', label: 'English', flag: '🇺🇸' },
  { locale: 'ja-JP', label: '日本語', flag: '🇯🇵' },
];

// ==================== 按钮组样式 ====================

/**
 * 按钮组语言切换器
 */
export function LanguageSwitcherButtons({
  className = '',
  onLanguageChange,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();

  const handleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    onLanguageChange?.(newLocale);
  };

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.locale}
          onClick={() => handleChange(option.locale)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg border-2
            transition-all duration-200 font-medium
            ${
              locale === option.locale
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
            }
          `}
          aria-label={option.label}
        >
          <span className="text-xl">{option.flag}</span>
          <span className="text-sm">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

// ==================== 下拉菜单样式 ====================

/**
 * 下拉菜单语言切换器
 */
export function LanguageSwitcherDropdown({
  className = '',
  onLanguageChange,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale;
    setLocale(newLocale);
    onLanguageChange?.(newLocale);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor="language-select" className="text-sm font-medium text-gray-700">
        {t('language.label')}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={handleChange}
        className="
          px-4 py-2 rounded-lg border-2 border-gray-300 bg-white
          text-gray-700 font-medium cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          hover:border-gray-400 transition-colors duration-200
        "
        aria-label={t('language.label')}
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.locale} value={option.locale}>
            {option.flag} {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ==================== 图标按钮样式 ====================

/**
 * 图标按钮语言切换器（带下拉菜单）
 */
export function LanguageSwitcherIcon({ className = '', onLanguageChange }: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentOption = LANGUAGE_OPTIONS.find((opt) => opt.locale === locale);

  const handleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
    onLanguageChange?.(newLocale);
  };

  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-switcher-icon-wrapper')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isOpen]);

  return (
    <div className={`relative language-switcher-icon-wrapper ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-gray-300
          bg-white hover:border-blue-300 hover:bg-blue-50
          transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
        aria-label="Switch Language"
        aria-expanded={isOpen}
      >
        <span className="text-xl">{currentOption?.flag}</span>
        <span className={`text-gray-600 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="
          absolute right-0 top-full mt-2 w-48
          bg-white border-2 border-gray-200 rounded-lg shadow-lg
          overflow-hidden z-50
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.locale}
              onClick={() => handleChange(option.locale)}
              className={`
                w-full flex items-center justify-between px-4 py-3
                transition-colors duration-150
                ${
                  locale === option.locale
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{option.flag}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </div>
              {locale === option.locale && (
                <span className="text-blue-600 font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * 语言切换器主组件
 * 根据 variant 自动选择样式
 */
export function LanguageSwitcher({
  variant = 'buttons',
  className,
  onLanguageChange,
}: LanguageSwitcherProps) {
  switch (variant) {
    case 'dropdown':
      return <LanguageSwitcherDropdown className={className} onLanguageChange={onLanguageChange} />;
    case 'icon':
      return <LanguageSwitcherIcon className={className} onLanguageChange={onLanguageChange} />;
    case 'buttons':
    default:
      return <LanguageSwitcherButtons className={className} onLanguageChange={onLanguageChange} />;
  }
}

// ==================== 默认导出 ====================

export default LanguageSwitcher;
