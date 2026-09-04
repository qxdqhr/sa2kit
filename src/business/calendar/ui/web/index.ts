/**
 * calendar Web UI — `sa2kit/business/calendar/ui/web`
 *
 * 鉴权：页面依赖 `useAuthContext`；宿主须用 `sa2kit/common/auth` 的 AuthProvider
 *（或 `@profile/auth/react` 的 AuthProvider，内部即 sa2kit + authClient）包裹。
 */

export type {
  CalendarEvent,
  RecurrenceRule,
  Reminder,
  CalendarConfig,
  EventFormData,
  RecurrenceFormData,
  ReminderFormData,
  CreateEventRequest,
  UpdateEventRequest,
  DeleteEventRequest,
  GetEventsRequest,
  ApiResponse,
  EventsResponse,
  EventResponse,
  CalendarViewProps,
  EventCardProps,
  EventFormProps,
  EventModalProps,
  MiniCalendarProps,
  EventListProps,
  CalendarState,
  CalendarActions,
  UseCalendarReturn,
  UseEventsReturn,
  DateRange,
  CalendarCell,
  TimeSlot,
  EventListSort,
  EventListFilter,
  EventListConfig,
  CalendarService,
  CalendarDbService,
} from './types';

export {
  RecurrenceType,
  ReminderType,
  ReminderStatus,
  CalendarViewType,
  EventColor,
  EventPriority,
  EventSortField,
  SortDirection,
  EventListDisplayMode,
} from './types';

export {
  formatDate,
  formatTime,
  formatDateTime,
  toLocalISOString,
  getMonthStart,
  getMonthEnd,
  getWeekStart,
  getWeekEnd,
  getDayStart,
  getDayEnd,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isToday,
  isWeekend,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  getMonthViewDates,
  getWeekViewDates,
  generateTimeSlots,
  parseDate,
  getDaysDifference,
  isWorkingHour,
  getMonthName,
  getWeekdayName,
  getRelativeTime,
  isValidDate,
  cloneDate,
} from './utils/dateUtils';

export { default as CalendarPageCore, type CalendarPageProps } from './pages/CalendarPage';
export { default as CalendarPage } from './pages/CalendarPage';
export { default as EventDetailPage } from './pages/EventDetailPage';

export { default as EventForm } from './components/EventForm';
export { default as EventModal } from './components/EventModal';
export { default as EventList } from './components/EventList';
export { default as EventSearch } from './components/EventSearch';
export { default as DraggableEvent } from './components/DraggableEvent';
export { default as DroppableCalendarCell } from './components/DroppableCalendarCell';
export { default as DraggableMonthView } from './components/DraggableMonthView';

export { useEvents } from './hooks/useEvents';
export { useEnhancedEvents } from './hooks/useEnhancedEvents';
export type { UseEnhancedEventsReturn } from './hooks/useEnhancedEvents';
export { useEventDrag } from './hooks/useEventDrag';
export type { UseEventDragReturn, DragState } from './hooks/useEventDrag';

export * from './services/eventTypeService';
export { LoginRegisterModals } from './LoginRegisterModals';
export type { LoginRegisterModalsProps } from './LoginRegisterModals';
