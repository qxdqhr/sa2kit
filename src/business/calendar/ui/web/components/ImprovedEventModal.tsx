'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button } from 'sa2kit/common/ui';
import { AlertCircle, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  EventType,
  EventData,
  EventTypeService,
} from '../services/eventTypeService';
import { CalendarEvent, EventPriority } from '../types';
import EventTypeSelector from './eventModal/EventTypeSelector';
import EventDetailsSection from './eventModal/EventDetailsSection';
import EventTimeSection from './eventModal/EventTimeSection';
import EventAppearanceSection from './eventModal/EventAppearanceSection';
import EventModalTabBar, { type EventModalTab } from './eventModal/EventModalTabBar';
import ImageToEventButton from './ImageToEventButton';
import type { CalendarEventFromImageOutput } from '../ai/eventFromImageTask.types';
import {
  formatDateOnly,
  formatDateTimeLocal,
  formatTimeOnly,
} from './eventModal/formUtils';
import { allDayBoundsFromDate, ensureEndAfterStart, parseEventDateTime, parseLocalISOString } from '../utils/dateUtils';
import { DEFAULT_FORM_DATA, type EventModalFormData } from './eventModal/types';
import { useCalendarSettings } from '../context/CalendarSettingsContext';
import { buildDefaultEventTimes, type CalendarSettings } from '../utils/calendarSettingsCore';
import { cal, eventModalBodyClass, modalActionsClass } from '../calendarStyles';

function buildFreshCreateFormData(
  initialDate: Date | undefined,
  settings: CalendarSettings
): EventModalFormData {
  if (!initialDate) {
    return { ...DEFAULT_FORM_DATA };
  }

  const { start: startDateTime, end: endDateTime } = buildDefaultEventTimes(initialDate, settings);
  return {
    ...DEFAULT_FORM_DATA,
    startTime: formatDateTimeLocal(startDateTime),
    endTime: formatDateTimeLocal(endDateTime),
    startDate: formatDateOnly(startDateTime),
    endDate: formatDateOnly(startDateTime),
    recurrenceStartDate: formatDateOnly(startDateTime),
    recurrenceStartTime: formatDateTimeLocal(startDateTime),
    recurrenceEndTime: formatDateTimeLocal(endDateTime),
  };
}

interface ImprovedEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: EventData) => Promise<void>;
  onDelete?: (eventId: number) => void;
  event?: CalendarEvent | null;
  initialDate?: Date;
  isMobile?: boolean;
}

async function copyTextToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

function resolveTabForError(message: string, isEditMode: boolean): EventModalTab {
  if (message.includes('标题')) return 'details';
  if (message.includes('颜色')) return 'appearance';
  if (
    message.includes('时间') ||
    message.includes('日期') ||
    message.includes('重复') ||
    message.includes('结束')
  ) {
    return 'schedule';
  }
  return isEditMode ? 'details' : 'type';
}

const ImprovedEventModal: React.FC<ImprovedEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate,
  isMobile = false,
}) => {
  const [eventType, setEventType] = useState<EventType>(EventType.SINGLE);
  const [activeTab, setActiveTab] = useState<EventModalTab>('details');
  const [formData, setFormData] = useState<EventModalFormData>(DEFAULT_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);

  const { settings } = useCalendarSettings();
  const isEditMode = !!event;

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(isEditMode ? 'details' : 'type');
    setErrors({});
  }, [isOpen, isEditMode]);

  useEffect(() => {
    if (!isOpen || !event) return;

    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    setEventType(EventType.SINGLE);
    setFormData({
      ...DEFAULT_FORM_DATA,
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      color: event.color || '#3b82f6',
      priority: event.priority || EventPriority.NORMAL,
      allDay: event.allDay,
      startTime: formatDateTimeLocal(startDate),
      endTime: formatDateTimeLocal(endDate),
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(endDate),
      dailyStartTime: formatTimeOnly(startDate),
      dailyEndTime: formatTimeOnly(endDate),
      recurrenceStartDate: formatDateOnly(startDate),
      recurrenceStartTime: formatDateTimeLocal(startDate),
      recurrenceEndTime: formatDateTimeLocal(endDate),
    });
  }, [isOpen, event?.id, event?.updatedAt ? new Date(event.updatedAt).getTime() : 0]);

  useEffect(() => {
    if (!isOpen || event) return;

    setEventType(EventType.SINGLE);
    setActiveTab('type');
    setFormData(buildFreshCreateFormData(initialDate, settings));
    if (aiPreviewUrl) URL.revokeObjectURL(aiPreviewUrl);
    setAiPreviewUrl(null);
  }, [isOpen, event, initialDate?.getTime(), settings]);

  const buildEventData = (): EventData => {
    switch (eventType) {
      case EventType.SINGLE: {
        if (formData.allDay) {
          const [year, month, day] = formData.startDate.split('-').map(Number);
          const { start, end } = allDayBoundsFromDate(new Date(year, month - 1, day));
          return {
            type: EventType.SINGLE,
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            location: formData.location.trim() || undefined,
            color: formData.color,
            priority: formData.priority,
            allDay: true,
            startTime: start,
            endTime: end,
          };
        }
        const parsedStart = parseLocalISOString(formData.startTime);
        const parsedEnd = parseLocalISOString(formData.endTime);
        const { startTime, endTime } = ensureEndAfterStart(parsedStart, parsedEnd);
        return {
          type: EventType.SINGLE,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          location: formData.location.trim() || undefined,
          color: formData.color,
          priority: formData.priority,
          allDay: false,
          startTime,
          endTime,
        };
      }

      case EventType.MULTI_DAY:
        return {
          type: EventType.MULTI_DAY,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          location: formData.location.trim() || undefined,
          color: formData.color,
          priority: formData.priority,
          allDay: formData.allDay,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          startTime: formData.allDay ? undefined : formData.dailyStartTime,
          endTime: formData.allDay ? undefined : formData.dailyEndTime,
        };

      case EventType.RECURRING:
        return {
          type: EventType.RECURRING,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          location: formData.location.trim() || undefined,
          color: formData.color,
          priority: formData.priority,
          allDay: formData.allDay,
          startDate: new Date(formData.recurrenceStartDate),
          startTime: new Date(formData.recurrenceStartTime),
          endTime: new Date(formData.recurrenceEndTime),
          recurrence: {
            pattern: formData.recurrencePattern,
            interval: formData.recurrenceInterval,
            endDate:
              formData.useEndDate && formData.recurrenceEndDate
                ? new Date(formData.recurrenceEndDate)
                : undefined,
            count:
              !formData.useEndDate && formData.recurrenceCount > 0
                ? formData.recurrenceCount
                : undefined,
          },
        };

      default:
        throw new Error(`不支持的活动类型: ${eventType}`);
    }
  };

  const validateForm = (): boolean => {
    const eventData = buildEventData();
    const validationErrors = EventTypeService.validateEventData(eventData);

    if (validationErrors.length === 0) {
      setErrors({});
      return true;
    }

    const firstError = validationErrors[0];
    setErrors({ general: validationErrors.join('\n') });
    setActiveTab(resolveTabForError(firstError, isEditMode));
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const eventData = buildEventData();
      await onSave(eventData);
      handleClose();
    } catch (error) {
      console.error('保存活动失败:', error);
      setErrors({ submit: '保存活动失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof EventModalFormData,
    value: string | boolean | number
  ) => {
    setFormData((prev) => {
      const next: EventModalFormData = { ...prev, [field]: value } as EventModalFormData;

      if (prev.allDay && field === 'startDate' && typeof value === 'string') {
        next.endDate = value;
      }

      if (
        !prev.allDay &&
        field === 'startTime' &&
        typeof value === 'string' &&
        prev.startTime &&
        prev.endTime
      ) {
        const oldStart = parseLocalISOString(prev.startTime);
        const oldEnd = parseLocalISOString(prev.endTime);
        const newStart = parseLocalISOString(value);
        if (!Number.isNaN(oldStart.getTime()) && !Number.isNaN(oldEnd.getTime()) && !Number.isNaN(newStart.getTime())) {
          const durationMs = Math.max(oldEnd.getTime() - oldStart.getTime(), 60 * 60 * 1000);
          next.endTime = formatDateTimeLocal(new Date(newStart.getTime() + durationMs));
        }
      }

      if (!prev.allDay && field === 'startDate' && typeof value === 'string') {
        const applyDate = (dateTime: string) => {
          if (!dateTime) return dateTime;
          const parsed = parseLocalISOString(dateTime);
          if (Number.isNaN(parsed.getTime())) return dateTime;
          const [year, month, day] = value.split('-').map(Number);
          parsed.setFullYear(year, month - 1, day);
          return formatDateTimeLocal(parsed);
        };
        const oldStart = prev.startTime ? parseLocalISOString(prev.startTime) : null;
        const oldEnd = prev.endTime ? parseLocalISOString(prev.endTime) : null;
        next.startTime = applyDate(prev.startTime);
        if (oldStart && oldEnd && !Number.isNaN(oldStart.getTime()) && !Number.isNaN(oldEnd.getTime())) {
          const durationMs = Math.max(oldEnd.getTime() - oldStart.getTime(), 60 * 60 * 1000);
          const newStart = parseLocalISOString(next.startTime);
          next.endTime = formatDateTimeLocal(new Date(newStart.getTime() + durationMs));
        } else {
          next.endTime = applyDate(prev.endTime);
        }
        next.startDate = value;
        next.endDate = value;
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: '' }));
    }
  };

  const handleDeleteRequest = () => {
    if (!event?.id || !onDelete) return;
    onDelete(event.id);
  };

  const handleClose = () => {
    setErrors({});
    if (aiPreviewUrl) URL.revokeObjectURL(aiPreviewUrl);
    setAiPreviewUrl(null);

    if (!event) {
      setEventType(EventType.SINGLE);
      setActiveTab('type');
      setFormData(buildFreshCreateFormData(undefined, settings));
    }

    onClose();
  };

  const applyAiDraft = (draft: CalendarEventFromImageOutput, previewUrl: string) => {
    setEventType(EventType.SINGLE);
    const startDate = parseEventDateTime(draft.startTime);
    const endDate = parseEventDateTime(draft.endTime);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setErrors({ general: '识别的时间格式无效，请手动填写' });
      URL.revokeObjectURL(previewUrl);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      title: draft.title,
      description: draft.description || '',
      location: draft.location || '',
      allDay: draft.allDay,
      startTime: formatDateTimeLocal(startDate),
      endTime: formatDateTimeLocal(endDate),
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(endDate),
      dailyStartTime: formatTimeOnly(startDate),
      dailyEndTime: formatTimeOnly(endDate),
      recurrenceStartDate: formatDateOnly(startDate),
      recurrenceStartTime: formatDateTimeLocal(startDate),
      recurrenceEndTime: formatDateTimeLocal(endDate),
    }));

    if (aiPreviewUrl) URL.revokeObjectURL(aiPreviewUrl);
    setAiPreviewUrl(previewUrl);
    setActiveTab('details');

    if (draft.confidence < 0.6) {
      setErrors({
        general: `识别完成（置信度 ${Math.round(draft.confidence * 100)}%），请核对时间与标题`,
      });
    } else {
      setErrors({});
    }
  };

  const timeVariant =
    eventType === EventType.MULTI_DAY
      ? 'multi_day'
      : eventType === EventType.RECURRING
        ? 'recurring'
        : 'single';

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={isEditMode ? '编辑活动' : '创建活动'}
      width={isMobile ? '100%' : 720}
      maskClosable={false}
      typewriter={false}
      footer={
        <div className={modalActionsClass(true)}>
          <div>
            {isEditMode && onDelete && (
              <Button type="danger-primary" size="small" onClick={handleDeleteRequest}>
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            )}
          </div>
          <div className={modalActionsClass()}>
            <Button type="default" size="small" onClick={handleClose}>
              取消
            </Button>
            <Button
              type="primary"
              size="small"
              loading={isLoading}
              onClick={handleSubmit}
            >
              {!isLoading && (isEditMode ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
              {isLoading ? '保存中…' : isEditMode ? '保存更改' : '创建活动'}
            </Button>
          </div>
        </div>
      }
    >
      <div className={isMobile ? 'flex max-h-[100dvh] flex-col' : ''}>
        {!isEditMode && (
          <div className="mb-3 flex justify-end">
            <ImageToEventButton
              onResult={applyAiDraft}
              onError={(message) => setErrors({ general: message })}
            />
          </div>
        )}
        {aiPreviewUrl && !isEditMode && (
          <div className={cal.aiPreview}>
            <img src={aiPreviewUrl} alt="识图来源" />
            <p>已根据此图片预填活动信息</p>
          </div>
        )}

        <EventModalTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isEditMode={isEditMode}
        />

        <div className={eventModalBodyClass(isMobile)}>
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === 'type' && !isEditMode && (
                <motion.div
                  key="tab-type"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                >
                  <EventTypeSelector value={eventType} onChange={setEventType} />
                </motion.div>
              )}

              {activeTab === 'details' && (
                <motion.div
                  key="tab-details"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                >
                  <EventDetailsSection
                    formData={formData}
                    errors={errors}
                    onChange={handleInputChange}
                  />
                </motion.div>
              )}

              {activeTab === 'schedule' && (
                <motion.div
                  key="tab-schedule"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                >
                  <EventTimeSection
                    formData={formData}
                    variant={timeVariant}
                    onChange={handleInputChange}
                  />
                </motion.div>
              )}

              {activeTab === 'appearance' && (
                <motion.div
                  key="tab-appearance"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                >
                  <EventAppearanceSection formData={formData} onChange={handleInputChange} />
                </motion.div>
              )}
            </AnimatePresence>

            {(errors.general || errors.submit) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                className="mt-4 space-y-2"
              >
                {errors.general && (
                  <div className={cal.errorBox}>
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">请检查表单</p>
                        <Button
                          type="text"
                          size="small"
                          onClick={() => void copyTextToClipboard(errors.general)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          复制
                        </Button>
                      </div>
                      <p
                        className="mt-1 cursor-text select-text whitespace-pre-wrap break-words text-sm"
                        role="status"
                      >
                        {errors.general}
                      </p>
                    </div>
                  </div>
                )}
                {errors.submit && (
                  <div className={cal.errorBox}>
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">保存失败</p>
                        <Button
                          type="text"
                          size="small"
                          onClick={() => void copyTextToClipboard(errors.submit)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          复制
                        </Button>
                      </div>
                      <p
                        className="mt-1 cursor-text select-text whitespace-pre-wrap break-words text-sm"
                        role="status"
                      >
                        {errors.submit}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default ImprovedEventModal;
