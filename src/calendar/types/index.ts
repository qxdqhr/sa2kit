/**
 * 日历模块类型定义
 * 
 * 定义了日历模块中使用的所有TypeScript类型，包括：
 * - 事件相关类型
 * - 日历视图类型  
 * - 重复规则类型
 * - 提醒类型
 * - API响应类型
 * - 组件Props类型
 */

// ===== 基础数据类型 =====

/**
 * 日历事件
 */
export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: string;
  color: string;
  priority: EventPriority;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  // 关联数据
  recurrenceRule?: RecurrenceRule;
  reminders?: Reminder[];
}

/**
 * 重复规则
 */
export interface RecurrenceRule {
  id: number;
  eventId: number;
  ruleType: RecurrenceType;
  interval: number;
  endDate?: Date;
  count?: number;
  byWeekday?: number[]; // 0-6, 0=周日
  byMonthday?: number[]; // 1-31
  byMonth?: number[]; // 1-12
}

/**
 * 提醒
 */
export interface Reminder {
  id: number;
  eventId: number;
  reminderTime: Date;
  reminderType: ReminderType;
  status: ReminderStatus;
  createdAt: Date;
}

// ===== 枚举类型 =====

/**
 * 重复类型
 */
export enum RecurrenceType {
  DAILY = 'daily',
  WEEKLY = 'weekly', 
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

/**
 * 提醒类型
 */
export enum ReminderType {
  NOTIFICATION = 'notification',
  EMAIL = 'email',
  SMS = 'sms'
}

/**
 * 提醒状态
 */
export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed'
}

/**
 * 日历视图类型
 */
export enum CalendarViewType {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
  AGENDA = 'agenda'
}

/**
 * 事件颜色预设
 */
export enum EventColor {
  BLUE = '#3B82F6',
  GREEN = '#10B981',
  PURPLE = '#8B5CF6',
  RED = '#EF4444',
  YELLOW = '#F59E0B',
  PINK = '#EC4899',
  INDIGO = '#6366F1',
  GRAY = '#6B7280'
}

/**
 * 事件优先级
 */
export enum EventPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// ===== 表单数据类型 =====

/**
 * 事件表单数据
 */
export interface EventFormData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: string;
  color: string;
  priority: EventPriority;
  recurrence?: RecurrenceFormData;
  reminders?: ReminderFormData[];
}

/**
 * 重复规则表单数据
 */
export interface RecurrenceFormData {
  ruleType: RecurrenceType;
  interval: number;
  endDate?: Date;
  count?: number;
  byWeekday?: number[];
  byMonthday?: number[];
  byMonth?: number[];
}

/**
 * 提醒表单数据
 */
export interface ReminderFormData {
  reminderTime: Date;
  reminderType: ReminderType;
}

// ===== API类型 =====

/**
 * API提醒数据
 */
export interface ReminderApiData {
  reminderTime: string; // ISO string
  reminderType: ReminderType;
}

/**
 * 创建事件请求
 */
export interface CreateEventRequest {
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  allDay: boolean;
  location?: string;
  color: string;
  priority: EventPriority;
  recurrence?: RecurrenceFormData;
  reminders?: ReminderApiData[];
}

/**
 * 更新事件请求
 */
export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  allDay?: boolean;
  location?: string;
  color?: string;
  priority?: EventPriority;
  recurrence?: RecurrenceFormData;
  reminders?: ReminderApiData[];
}

/**
 * 删除事件请求
 */
export interface DeleteEventRequest {
  id: number;
  deleteAll?: boolean; // 是否删除所有重复事件
}

/**
 * 获取事件请求参数
 */
export interface GetEventsRequest {
  startDate: string; // ISO string
  endDate: string; // ISO string
  viewType?: CalendarViewType;
  userId?: number;
}

/**
 * API响应基础类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 事件列表响应
 */
export interface EventsResponse extends ApiResponse<CalendarEvent[]> {}

/**
 * 单个事件响应
 */
export interface EventResponse extends ApiResponse<CalendarEvent> {}

// ===== 组件Props类型 =====

/**
 * 日历视图组件Props
 */
export interface CalendarViewProps {
  events: CalendarEvent[];
  viewType: CalendarViewType;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewTypeChange: (viewType: CalendarViewType) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventCreate: (event: EventFormData) => void;
  onEventUpdate: (event: CalendarEvent) => void;
  onEventDelete: (eventId: number) => void;
  loading?: boolean;
  className?: string;
}

/**
 * 事件卡片组件Props
 */
export interface EventCardProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: number) => void;
  compact?: boolean;
  className?: string;
}

/**
 * 事件表单组件Props
 */
export interface EventFormProps {
  event?: CalendarEvent;
  onSubmit: (eventData: EventFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * 事件弹窗组件Props
 */
export interface EventModalProps {
  isOpen: boolean;
  event?: CalendarEvent;
  onClose: () => void;
  onSave: (eventData: EventFormData) => void;
  onDelete?: (eventId: number) => void;
  loading?: boolean;
}

/**
 * 迷你日历组件Props
 */
export interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events?: CalendarEvent[];
  highlightDatesWithEvents?: boolean;
  className?: string;
}

// ===== 状态管理类型 =====

/**
 * 日历状态
 */
export interface CalendarState {
  events: CalendarEvent[];
  currentDate: Date;
  viewType: CalendarViewType;
  selectedEvent?: CalendarEvent;
  loading: boolean;
  error?: string;
}

/**
 * 日历操作类型
 */
export interface CalendarActions {
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (eventId: number) => void;
  setCurrentDate: (date: Date) => void;
  setViewType: (viewType: CalendarViewType) => void;
  setSelectedEvent: (event?: CalendarEvent) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
}

// ===== Hook返回类型 =====

/**
 * useCalendar Hook返回类型
 */
export interface UseCalendarReturn {
  state: CalendarState;
  actions: CalendarActions;
  loadEvents: (startDate: Date, endDate: Date) => Promise<void>;
  createEvent: (eventData: EventFormData) => Promise<CalendarEvent>;
  updateEvent: (eventId: number, eventData: Partial<EventFormData>) => Promise<CalendarEvent>;
  deleteEvent: (eventId: number, deleteAll?: boolean) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

/**
 * useEvents Hook返回类型
 */
export interface UseEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error?: string;
  createEvent: (eventData: EventFormData) => Promise<CalendarEvent>;
  updateEvent: (eventId: number, eventData: Partial<EventFormData>) => Promise<CalendarEvent>;
  deleteEvent: (eventId: number, deleteAll?: boolean) => Promise<void>;
  loadEvents: (startDate: Date, endDate: Date) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

// ===== 工具类型 =====

/**
 * 日期范围
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * 日历单元格数据
 */
export interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

/**
 * 时间槽数据
 */
export interface TimeSlot {
  time: Date;
  events: CalendarEvent[];
  isWorkingHour: boolean;
}

// ===== 配置类型 =====

/**
 * 日历配置
 */
export interface CalendarConfig {
  firstDayOfWeek: number; // 0=周日, 1=周一
  workingHours: {
    start: string; // "09:00"
    end: string; // "18:00"
  };
  timeZone: string;
  dateFormat: string;
  timeFormat: string;
  defaultView: CalendarViewType;
  defaultEventColor: string;
  weekends: boolean;
  eventColors: Record<string, string>;
}

/**
 * 服务接口
 */
export interface CalendarService {
  getEvents(params: GetEventsRequest): Promise<CalendarEvent[]>;
  createEvent(eventData: CreateEventRequest): Promise<CalendarEvent>;
  updateEvent(eventId: number, eventData: UpdateEventRequest): Promise<CalendarEvent>;
  deleteEvent(eventId: number, deleteAll?: boolean): Promise<void>;
  getEvent(eventId: number): Promise<CalendarEvent>;
}

/**
 * 数据库服务接口
 */
export interface CalendarDbService {
  getAllEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  getEventById(eventId: number): Promise<CalendarEvent | null>;
  createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent>;
  updateEvent(eventId: number, eventData: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteEvent(eventId: number): Promise<void>;
  createRecurrenceRule(ruleData: Omit<RecurrenceRule, 'id'>): Promise<RecurrenceRule>;
  updateRecurrenceRule(ruleId: number, ruleData: Partial<RecurrenceRule>): Promise<RecurrenceRule>;
  deleteRecurrenceRule(ruleId: number): Promise<void>;
  createReminder(reminderData: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder>;
  updateReminder(reminderId: number, reminderData: Partial<Reminder>): Promise<Reminder>;
  deleteReminder(reminderId: number): Promise<void>;
}

// ===== 事件列表相关类型 =====

/**
 * 事件排序字段
 */
export enum EventSortField {
  START_TIME = 'startTime',
  TITLE = 'title',
  PRIORITY = 'priority',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

/**
 * 排序方向
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * 事件列表显示模式
 */
export enum EventListDisplayMode {
  LIST = 'list',
  GRID = 'grid'
}

/**
 * 事件列表排序配置
 */
export interface EventListSort {
  field: EventSortField;
  direction: SortDirection;
}

/**
 * 事件列表过滤配置
 */
export interface EventListFilter {
  priority?: EventPriority;
  color?: string;
  dateRange?: DateRange;
  searchText?: string;
}

/**
 * 事件列表配置
 */
export interface EventListConfig {
  displayMode: EventListDisplayMode;
  sort: EventListSort;
  filter: EventListFilter;
  pageSize: number;
  currentPage: number;
}

/**
 * 事件列表Props
 */
export interface EventListProps {
  events: CalendarEvent[];
  config: EventListConfig;
  onConfigChange: (config: EventListConfig) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventEdit: (event: CalendarEvent) => void;
  onEventDelete: (eventId: number) => void;
  onBatchDelete?: (eventIds: number[]) => Promise<void>;
  enableBatchActions?: boolean;
  loading?: boolean;
  className?: string;
} 