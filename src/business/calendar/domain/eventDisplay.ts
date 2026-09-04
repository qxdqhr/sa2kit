import { EventPriority } from './types';

/** 纯领域：优先级字符串解析（无 UI 依赖） */
export function mapStringToEventPriority(priority: string): EventPriority {
  switch (priority.toLowerCase()) {
    case 'low':
      return EventPriority.LOW;
    case 'high':
      return EventPriority.HIGH;
    case 'urgent':
      return EventPriority.URGENT;
    default:
      return EventPriority.NORMAL;
  }
}

export const EVENT_COLOR_PRESETS = [
  '#3B82F6',
  '#10B981',
  '#EF4444',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
] as const;

export type EventSurfaceKey =
  | 'blue'
  | 'green'
  | 'purple'
  | 'red'
  | 'yellow'
  | 'pink'
  | 'indigo'
  | 'gray';

const HEX_SURFACE_MAP: Record<string, EventSurfaceKey> = {
  '#3B82F6': 'blue',
  '#10B981': 'green',
  '#8B5CF6': 'purple',
  '#EF4444': 'red',
  '#F59E0B': 'yellow',
  '#EC4899': 'pink',
  '#6366F1': 'indigo',
  '#6B7280': 'gray',
};

const NAMED_SURFACE_MAP: Record<string, EventSurfaceKey> = {
  blue: 'blue',
  green: 'green',
  red: 'red',
  purple: 'purple',
  yellow: 'yellow',
};

/** 颜色 → surface key（样式类由宿主 / ui/web 映射） */
export function resolveEventSurfaceKey(color?: string): EventSurfaceKey {
  if (!color) return 'gray';
  return HEX_SURFACE_MAP[color] ?? NAMED_SURFACE_MAP[color] ?? 'blue';
}

export function getPriorityLabelText(priority: EventPriority): string {
  switch (priority) {
    case EventPriority.URGENT:
      return '紧急';
    case EventPriority.HIGH:
      return '高';
    case EventPriority.LOW:
      return '低';
    default:
      return '普通';
  }
}
