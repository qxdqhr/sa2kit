'use client';

import React from 'react';
import { AlignLeft, Clock, Layers, Palette } from 'lucide-react';
import { cal, eventTabClass } from '../../calendarStyles';

export type EventModalTab = 'type' | 'details' | 'schedule' | 'appearance';

export interface EventModalTabItem {
  id: EventModalTab;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  createOnly?: boolean;
}

export const EVENT_MODAL_TABS: EventModalTabItem[] = [
  { id: 'type', label: '类型', icon: Layers, createOnly: true },
  { id: 'details', label: '详情', icon: AlignLeft },
  { id: 'schedule', label: '时间', icon: Clock },
  { id: 'appearance', label: '样式', icon: Palette },
];

interface EventModalTabBarProps {
  activeTab: EventModalTab;
  onTabChange: (tab: EventModalTab) => void;
  isEditMode: boolean;
}

export default function EventModalTabBar({
  activeTab,
  onTabChange,
  isEditMode,
}: EventModalTabBarProps) {
  const visibleTabs = EVENT_MODAL_TABS.filter((tab) => !tab.createOnly || !isEditMode);

  return (
    <div className={`${cal.eventTabbar} mt-4`} role="tablist" aria-label="活动表单分区">
      {visibleTabs.map((tab) => {
        const selected = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={(e) => {
              onTabChange(tab.id);
              e.currentTarget.blur();
            }}
            className={eventTabClass(selected)}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={selected ? 2.25 : 2} />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
