'use client';

import React, { createContext, useContext } from 'react';
import type { CalendarUiComponents } from './types';

const CalendarUiContext = createContext<CalendarUiComponents | null>(null);

export function CalendarUiProvider({
  value,
  children,
}: {
  value: CalendarUiComponents;
  children: React.ReactNode;
}) {
  return (
    <CalendarUiContext.Provider value={value}>{children}</CalendarUiContext.Provider>
  );
}

export function useCalendarUi(): CalendarUiComponents {
  const ctx = useContext(CalendarUiContext);
  if (!ctx) {
    throw new Error(
      '[calendar] 缺少 CalendarUiProvider；请在页面层注入 Modal / ConfirmModal（R2-404）',
    );
  }
  return ctx;
}
