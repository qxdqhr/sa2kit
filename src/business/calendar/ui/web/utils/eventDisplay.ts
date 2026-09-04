import { EventPriority } from '../types';
import {
  EVENT_COLOR_PRESETS,
  getPriorityLabelText,
  mapStringToEventPriority,
  resolveEventSurfaceKey,
} from 'sa2kit/business/calendar/domain';
import {
  eventSurfaceClass,
  priorityBadgeClass,
} from '../calendarStyles';

export { EVENT_COLOR_PRESETS, mapStringToEventPriority };

/** 事件颜色 → 暖色样式（月格、列表共用）；key 解析在 domain */
export function getEventSurfaceClasses(color?: string): string {
  return eventSurfaceClass(resolveEventSurfaceKey(color));
}

export function getPriorityLabel(priority: EventPriority): {
  text: string;
  className: string;
} {
  const text = getPriorityLabelText(priority);
  switch (priority) {
    case EventPriority.URGENT:
      return { text, className: priorityBadgeClass('urgent') };
    case EventPriority.HIGH:
      return { text, className: priorityBadgeClass('high') };
    case EventPriority.LOW:
      return { text, className: priorityBadgeClass('low') };
    default:
      return { text, className: priorityBadgeClass('normal') };
  }
}
