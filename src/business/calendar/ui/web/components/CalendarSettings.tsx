'use client';

import React, { useState } from 'react';
import { Button, Select, Switch, Title } from 'sa2kit/common/ui';
import { COLOR_THEMES, type CalendarThemeKey } from '../utils/calendarSettingsCore';
import { useCalendarSettings } from '../context/CalendarSettingsContext';
import { AiApiSettingsPanel } from 'sa2kit/common/aiApi/client';
import { cal, settingsTabClass, themeCardClass } from '../calendarStyles';
import { cn } from '../utils/cn';

export type { CalendarSettings, CalendarThemeKey } from '../utils/calendarSettingsCore';

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

export default function CalendarSettings({ className = '' }: { className?: string }) {
  const { settings, updateSettings, resetSettings } = useCalendarSettings();
  const [activeTab, setActiveTab] = useState<'theme' | 'general' | 'time' | 'ai'>('theme');

  return (
    <div className={cn(`${cal.panel} ${cal.panelFlush}`, 'flex h-full min-h-0 flex-col', className)}>
      <div className={cn(cal.settingsTabs, 'shrink-0')}>
        {[
          { key: 'theme', label: '主题样式', icon: '🎨' },
          { key: 'general', label: '常规设置', icon: '⚙️' },
          { key: 'time', label: '时间设置', icon: '⏰' },
          { key: 'ai', label: 'AI', icon: '🤖' },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'theme' | 'general' | 'time' | 'ai')}
            className={settingsTabClass(activeTab === key)}
          >
            <span className="mr-2">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div className={cn(cal.scrollY, cal.scrollHidden, 'min-h-0 flex-1 p-6')}>
        {activeTab === 'theme' && (
          <div>
            <Title size="small" color="app-yellow">
              预设主题
            </Title>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                <div
                  key={key}
                  onClick={() => updateSettings({ theme: key as CalendarThemeKey })}
                  className={themeCardClass(settings.theme === key)}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className={`${cal.textHeading} font-medium`}>{theme.name}</h4>
                    {settings.theme === key && (
                      <svg className="h-5 w-5 text-[#19c8b9]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="mb-3 flex space-x-1">
                    {Object.values(theme.colors)
                      .slice(0, 6)
                      .map((color, index) => (
                        <div
                          key={index}
                          className="h-6 w-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                  </div>

                  <div className="text-xs">
                    <div
                      className="grid grid-cols-7 gap-1 rounded border p-2"
                      style={{
                        backgroundColor: theme.background.calendar,
                        borderColor: theme.border.calendar,
                      }}
                    >
                      {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                        <div
                          key={day}
                          className="py-1 text-center text-xs"
                          style={{ color: theme.text.secondary }}
                        >
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: 7 }, (_, index) => (
                        <div
                          key={index}
                          className="flex aspect-square items-center justify-center rounded text-xs"
                          style={{
                            backgroundColor:
                              index === 3 ? theme.background.today : theme.background.cell,
                            color: index === 3 ? theme.text.today : theme.text.primary,
                            border: `1px solid ${index === 3 ? theme.border.today : theme.border.cell}`,
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
        )}

        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className={`${cal.label} mb-2 block`}>一周开始于</label>
              <Select
                value={String(settings.weekStartsOn)}
                onChange={(value: string) => updateSettings({ weekStartsOn: Number(value) })}
                options={WEEK_START_OPTIONS.map((o) => ({
                  label: o.label,
                  key: String(o.value),
                }))}
              />
            </div>

            <div>
              <label className={`${cal.label} mb-2 block`}>语言</label>
              <Select
                value={settings.language}
                onChange={(value: string) => updateSettings({ language: value })}
                options={LANGUAGE_OPTIONS.map((o) => ({ label: o.label, key: o.value }))}
              />
            </div>

            <div className="space-y-4">
              <h3 className={`${cal.textHeading} text-base`}>显示选项</h3>

              <label className="flex items-center gap-3">
                <Switch
                  checked={settings.showWeekNumbers}
                  onChange={(checked: boolean) => updateSettings({ showWeekNumbers: checked })}
                />
                <span className={`${cal.textBody} text-sm`}>显示周数</span>
              </label>

              <label className="flex items-center gap-3">
                <Switch
                  checked={settings.showLunarCalendar}
                  onChange={(checked: boolean) => updateSettings({ showLunarCalendar: checked })}
                />
                <span className={`${cal.textBody} text-sm`}>显示农历</span>
              </label>
            </div>

            <div>
              <label className={`${cal.label} mb-2 block`}>默认活动时长（分钟）</label>
              <input
                type="number"
                min="15"
                max="480"
                step="15"
                value={settings.defaultEventDuration}
                onChange={(e) => updateSettings({ defaultEventDuration: Number(e.target.value) })}
                className={cal.input}
              />
            </div>
          </div>
        )}

        {activeTab === 'time' && (
          <div className="space-y-6">
            <div>
              <label className={`${cal.label} mb-2 block`}>时间格式</label>
              <Select
                value={settings.timeFormat}
                onChange={(value: string) => updateSettings({ timeFormat: value as '12h' | '24h' })}
                options={TIME_FORMAT_OPTIONS.map((o) => ({ label: o.label, key: o.value }))}
              />
            </div>

            <div>
              <Title size="small" color="app-teal">
                工作时间
              </Title>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className={`${cal.label} mb-2 block`}>开始时间</label>
                  <input
                    type="time"
                    value={settings.workingHours.start}
                    onChange={(e) =>
                      updateSettings({
                        workingHours: {
                          ...settings.workingHours,
                          start: e.target.value,
                        },
                      })
                    }
                    className={cal.input}
                  />
                </div>
                <div>
                  <label className={`${cal.label} mb-2 block`}>结束时间</label>
                  <input
                    type="time"
                    value={settings.workingHours.end}
                    onChange={(e) =>
                      updateSettings({
                        workingHours: {
                          ...settings.workingHours,
                          end: e.target.value,
                        },
                      })
                    }
                    className={cal.input}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <AiApiSettingsPanel
            apiKeyPlaceholder="sk-… 或 tp-…（小米 MiMo）"
            baseUrlPlaceholder="https://api.xiaomimimo.com/v1"
            visionModelPlaceholder="mimo-v2.5"
            serverMissingHint={
              <>
                请在{' '}
                <code className="rounded bg-amber-100 px-1">config/app.config.*.yaml</code> 的{' '}
                <code className="rounded bg-amber-100 px-1">ai:</code> 节填写 apiKey，或在下方的浏览器设置中填写。
              </>
            }
          />
        )}

        <div className={`${cal.dividerTop} pt-6`}>
          <Button type="default" size="small" onClick={resetSettings}>
            重置日历设置为默认
          </Button>
        </div>
      </div>
    </div>
  );
}
