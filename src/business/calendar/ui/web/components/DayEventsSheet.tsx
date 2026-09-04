'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Trash2, MapPin, Clock } from 'lucide-react';
import { Button } from 'sa2kit/common/ui';
import { CalendarEvent } from '../types';
import { formatDate, isToday } from '../utils/dateUtils';
import { getEventSurfaceClasses, getPriorityLabel } from '../utils/eventDisplay';
import { useCalendarSettings } from '../context/CalendarSettingsContext';
import { formatTimeForSettings } from '../utils/calendarSettingsCore';
import { cal } from '../calendarStyles';
import { cn } from '../utils/cn';

export interface DayEventsSheetProps {
  date: Date | null;
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
  onCreate: (date: Date) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: number) => void;
  isAuthenticated: boolean;
  onRequireLogin: () => void;
}

export default function DayEventsSheet({
  date,
  events,
  isOpen,
  onClose,
  onCreate,
  onEdit,
  onDelete,
  isAuthenticated,
  onRequireLogin,
}: DayEventsSheetProps) {
  const { settings } = useCalendarSettings();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const dayEvents = date
    ? events
        .filter((e) => formatDate(new Date(e.startTime)) === formatDate(date))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    : [];

  const title = date
    ? date.toLocaleDateString(settings.language, {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : '';

  const handleCreate = () => {
    if (!date) return;
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    onCreate(date);
  };

  return (
    <AnimatePresence>
      {isOpen && date && (
        <>
          <motion.button
            type="button"
            aria-label="关闭"
            className={cal.sheetBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="day-events-title"
            className={cal.sheet}
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
          >
            <div className={`${cal.sheetHandle} md:hidden`} />
            <header className={cal.sheetHeader}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#11a89b]">
                  {isToday(date) ? '今天' : formatDate(date)}
                </p>
                <h2
                  id="day-events-title"
                  className={`${cal.textHeading} mt-0.5 text-lg`}
                >
                  {title}
                </h2>
                <p className={`${cal.textMuted} mt-1 tabular-nums text-sm`}>
                  {dayEvents.length} 个活动
                </p>
              </div>
              <Button type="text" size="small" onClick={onClose} aria-label="关闭面板">
                <X className="h-5 w-5" />
              </Button>
            </header>

            <div className={cal.sheetBody}>
              {dayEvents.length === 0 ? (
                <div className={`${cal.empty} py-10`}>
                  <p className={`${cal.textBody} text-sm`}>这一天还没有安排</p>
                  <p className={`${cal.textMuted} mt-1 text-xs`}>点击下方按钮添加活动</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {dayEvents.map((event, index) => {
                    const priority = getPriorityLabel(event.priority);
                    return (
                      <motion.li
                        key={event.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        className={cn(cal.eventCard, 'p-3', getEventSurfaceClasses(event.color))}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-1 h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: event.color || '#3B82F6' }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`${cal.textHeading} truncate font-medium`}>
                                {event.title}
                              </h3>
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${priority.className}`}
                              >
                                {priority.text}
                              </span>
                            </div>
                            <div className={`${cal.textMuted} mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs`}>
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                {event.allDay
                                  ? '全天'
                                  : `${formatTimeForSettings(new Date(event.startTime), settings)} – ${formatTimeForSettings(new Date(event.endTime), settings)}`}
                              </span>
                              {event.location && (
                                <span className="inline-flex min-w-0 items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                  <span className="truncate">{event.location}</span>
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className={`${cal.textMuted} mt-2 line-clamp-2 text-xs`}>
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`${cal.dividerTop} mt-3 flex justify-end gap-1 pt-2`}>
                          <Button
                            type="text"
                            size="small"
                            onClick={() => {
                              if (!isAuthenticated) {
                                onRequireLogin();
                                return;
                              }
                              onEdit(event);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            编辑
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            onClick={() => {
                              if (!isAuthenticated) {
                                onRequireLogin();
                                return;
                              }
                              onDelete(event.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            删除
                          </Button>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className={cal.sheetFooter}>
              <Button type="primary" block onClick={handleCreate}>
                <Plus className="h-5 w-5" />
                添加活动
              </Button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
