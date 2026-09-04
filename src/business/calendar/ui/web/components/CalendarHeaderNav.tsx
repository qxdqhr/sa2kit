'use client';

import React from 'react';
import { Calculator, CalendarDays, List, LogIn, Settings } from 'lucide-react';
import { Button, Title } from 'sa2kit/common/ui';
import { UserMenu } from 'sa2kit/common/auth/components';
import { cal, navItemClass } from '../calendarStyles';

export type CalendarMainTab = 'calendar' | 'events' | 'tools' | 'settings';

export interface CalendarHeaderNavProps {
  activeTab: CalendarMainTab;
  onTabChange: (tab: CalendarMainTab) => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onOpenSettings?: () => void;
  showToolsTab?: boolean;
}

const NAV_ITEMS: {
  id: CalendarMainTab;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: 'calendar', label: '日历', icon: CalendarDays },
  { id: 'events', label: '全部活动', icon: List },
  { id: 'tools', label: '日期工具', icon: Calculator },
  { id: 'settings', label: '设置', icon: Settings },
];

export default function CalendarHeaderNav({
  activeTab,
  onTabChange,
  isAuthenticated,
  onLoginClick,
  onOpenSettings,
  showToolsTab = true,
}: CalendarHeaderNavProps) {
  const navItems = showToolsTab ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.id !== 'tools');
  return (
    <header className={cal.header}>
      <div className={cal.headerRow}>
        <Title size="small" color="app-teal">
          日历
        </Title>

        <div className="flex shrink-0 items-center">
          {isAuthenticated ? (
            <UserMenu
              customMenuItems={
                onOpenSettings
                  ? [
                      {
                        id: 'settings',
                        label: '个人设置',
                        icon: Settings,
                        onClick: onOpenSettings,
                      },
                    ]
                  : undefined
              }
            />
          ) : (
            <Button type="primary" size="small" onClick={onLoginClick}>
              <LogIn className="h-4 w-4" strokeWidth={2} />
              登录
            </Button>
          )}
        </div>
      </div>

      <nav className={cal.nav} role="tablist" aria-label="日历功能导航">
        {navItems.map((item) => {
          const selected = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(item.id)}
              className={navItemClass(selected)}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={selected ? 2.25 : 2} />
              <span className={cal.navItemLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
