import React, { useState, useEffect } from 'react';

// 预设颜色主题
const COLOR_THEMES = {
  default: {
    name: '默认主题',
    colors: {
      primary: '#3B82F6',      // 蓝色
      secondary: '#10B981',    // 绿色
      accent: '#F59E0B',       // 黄色
      danger: '#EF4444',       // 红色
      purple: '#8B5CF6',       // 紫色
      pink: '#EC4899',         // 粉色
      indigo: '#6366F1',       // 靛蓝
      teal: '#14B8A6',         // 青色
    },
    background: {
      calendar: '#FFFFFF',
      cell: '#F9FAFB',
      today: '#EFF6FF',
      weekend: '#F3F4F6',
      otherMonth: '#F9FAFB',
    },
    border: {
      calendar: '#E5E7EB',
      cell: '#E5E7EB',
      today: '#3B82F6',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      today: '#1D4ED8',
      weekend: '#9CA3AF',
      otherMonth: '#D1D5DB',
    }
  },
  dark: {
    name: '深色主题',
    colors: {
      primary: '#60A5FA',
      secondary: '#34D399',
      accent: '#FBBF24',
      danger: '#F87171',
      purple: '#A78BFA',
      pink: '#F472B6',
      indigo: '#818CF8',
      teal: '#2DD4BF',
    },
    background: {
      calendar: '#1F2937',
      cell: '#374151',
      today: '#1E3A8A',
      weekend: '#374151',
      otherMonth: '#374151',
    },
    border: {
      calendar: '#4B5563',
      cell: '#4B5563',
      today: '#60A5FA',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      today: '#DBEAFE',
      weekend: '#9CA3AF',
      otherMonth: '#6B7280',
    }
  },
  colorful: {
    name: '彩色主题',
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      danger: '#EF4444',
      purple: '#8B5CF6',
      pink: '#EC4899',
      indigo: '#6366F1',
      teal: '#14B8A6',
    },
    background: {
      calendar: '#FFFFFF',
      cell: '#FEF3C7',
      today: '#DDD6FE',
      weekend: '#FECACA',
      otherMonth: '#F3F4F6',
    },
    border: {
      calendar: '#D1D5DB',
      cell: '#D1D5DB',
      today: '#8B5CF6',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      today: '#5B21B6',
      weekend: '#DC2626',
      otherMonth: '#9CA3AF',
    }
  }
};

// 其他设置选项
const WEEK_START_OPTIONS = [
  { value: 0, label: '周日开始' },
  { value: 1, label: '周一开始' },
];

const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12小时制' },
  { value: '24h', label: '24小时制' },
];

const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
];

interface CalendarSettingsProps {
  onSettingsChange?: (settings: CalendarSettings) => void;
}

export interface CalendarSettings {
  theme: keyof typeof COLOR_THEMES;
  customColors?: {
    [key: string]: string;
  };
  weekStartsOn: number;
  timeFormat: '12h' | '24h';
  language: string;
  showWeekNumbers: boolean;
  showLunarCalendar: boolean;
  defaultEventDuration: number; // 分钟
  workingHours: {
    start: string;
    end: string;
  };
}

const DEFAULT_SETTINGS: CalendarSettings = {
  theme: 'default',
  weekStartsOn: 1,
  timeFormat: '24h',
  language: 'zh-CN',
  showWeekNumbers: false,
  showLunarCalendar: false,
  defaultEventDuration: 60,
  workingHours: {
    start: '09:00',
    end: '18:00',
  },
};

export default function CalendarSettings({ onSettingsChange }: CalendarSettingsProps) {
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'theme' | 'general' | 'time'>('theme');

  // 从localStorage加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('calendar-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } catch (error) {
        console.error('加载日历设置失败:', error);
      }
    }
  }, []);

  // 保存设置到localStorage
  const saveSettings = (newSettings: CalendarSettings) => {
    setSettings(newSettings);
    localStorage.setItem('calendar-settings', JSON.stringify(newSettings));
    onSettingsChange?.(newSettings);
  };

  // 更新设置
  const updateSettings = (updates: Partial<CalendarSettings>) => {
    const newSettings = { ...settings, ...updates };
    saveSettings(newSettings);
  };

  // 重置设置
  const resetSettings = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  // 当前主题
  const currentTheme = COLOR_THEMES[settings.theme];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 标题 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">日历设置</h2>
        <p className="text-sm text-gray-600 mt-1">
          自定义您的日历外观和行为
        </p>
      </div>

      {/* 选项卡 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'theme', label: '主题样式', icon: '🎨' },
            { key: 'general', label: '常规设置', icon: '⚙️' },
            { key: 'time', label: '时间设置', icon: '⏰' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* 主题样式设置 */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            {/* 预设主题 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">预设主题</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                  <div
                    key={key}
                    onClick={() => updateSettings({ theme: key as keyof typeof COLOR_THEMES })}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      settings.theme === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{theme.name}</h4>
                      {settings.theme === key && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    
                    {/* 颜色预览 */}
                    <div className="flex space-x-1 mb-3">
                      {Object.values(theme.colors).slice(0, 6).map((color, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    
                    {/* 日历预览 */}
                    <div className="text-xs">
                      <div 
                        className="grid grid-cols-7 gap-1 p-2 rounded border"
                        style={{ 
                          backgroundColor: theme.background.calendar,
                          borderColor: theme.border.calendar 
                        }}
                      >
                        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                          <div 
                            key={day}
                            className="text-center py-1 text-xs"
                            style={{ color: theme.text.secondary }}
                          >
                            {day}
                          </div>
                        ))}
                        {Array.from({ length: 7 }, (_, index) => (
                          <div
                            key={index}
                            className="aspect-square flex items-center justify-center text-xs rounded"
                            style={{
                              backgroundColor: index === 3 ? theme.background.today : theme.background.cell,
                              color: index === 3 ? theme.text.today : theme.text.primary,
                              border: `1px solid ${index === 3 ? theme.border.today : theme.border.cell}`
                            }}
                          >
                            {index + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 自定义颜色 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">自定义颜色</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(currentTheme.colors).map(([key, defaultColor]) => (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {key === 'primary' ? '主色' : 
                       key === 'secondary' ? '次要色' : 
                       key === 'accent' ? '强调色' : 
                       key === 'danger' ? '危险色' : key}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.customColors?.[key] || defaultColor}
                        onChange={(e) => updateSettings({
                          customColors: {
                            ...settings.customColors,
                            [key]: e.target.value
                          }
                        })}
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.customColors?.[key] || defaultColor}
                        onChange={(e) => updateSettings({
                          customColors: {
                            ...settings.customColors,
                            [key]: e.target.value
                          }
                        })}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={defaultColor}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 常规设置 */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* 一周开始 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                一周开始于
              </label>
              <select
                value={settings.weekStartsOn}
                onChange={(e) => updateSettings({ weekStartsOn: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WEEK_START_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 语言设置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                语言
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 显示选项 */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">显示选项</h3>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showWeekNumbers}
                  onChange={(e) => updateSettings({ showWeekNumbers: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">显示周数</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showLunarCalendar}
                  onChange={(e) => updateSettings({ showLunarCalendar: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">显示农历</span>
              </label>
            </div>

            {/* 默认事件时长 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                默认事件时长（分钟）
              </label>
              <input
                type="number"
                min="15"
                max="480"
                step="15"
                value={settings.defaultEventDuration}
                onChange={(e) => updateSettings({ defaultEventDuration: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* 时间设置 */}
        {activeTab === 'time' && (
          <div className="space-y-6">
            {/* 时间格式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                时间格式
              </label>
              <select
                value={settings.timeFormat}
                onChange={(e) => updateSettings({ timeFormat: e.target.value as '12h' | '24h' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIME_FORMAT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 工作时间 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">工作时间</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    开始时间
                  </label>
                  <input
                    type="time"
                    value={settings.workingHours.start}
                    onChange={(e) => updateSettings({
                      workingHours: {
                        ...settings.workingHours,
                        start: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    结束时间
                  </label>
                  <input
                    type="time"
                    value={settings.workingHours.end}
                    onChange={(e) => updateSettings({
                      workingHours: {
                        ...settings.workingHours,
                        end: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            重置为默认
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(settings, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'calendar-settings.json';
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              导出设置
            </button>
            
            <label className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors cursor-pointer">
              导入设置
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const importedSettings = JSON.parse(event.target?.result as string);
                        saveSettings({ ...DEFAULT_SETTINGS, ...importedSettings });
                      } catch (error) {
                        alert('导入设置失败，请检查文件格式');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
} 