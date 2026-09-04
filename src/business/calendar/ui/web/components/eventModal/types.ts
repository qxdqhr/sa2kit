import { EventPriority } from '../../types';
import { RecurrencePattern } from '../../services/eventTypeService';

export interface EventModalFormData {
  title: string;
  description: string;
  location: string;
  color: string;
  priority: EventPriority;
  allDay: boolean;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  recurrenceStartDate: string;
  recurrenceStartTime: string;
  recurrenceEndTime: string;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval: number;
  recurrenceEndDate: string;
  recurrenceCount: number;
  useEndDate: boolean;
}

export const DEFAULT_FORM_DATA: EventModalFormData = {
  title: '',
  description: '',
  location: '',
  color: '#3b82f6',
  priority: EventPriority.NORMAL,
  allDay: false,
  startTime: '',
  endTime: '',
  startDate: '',
  endDate: '',
  dailyStartTime: '09:00',
  dailyEndTime: '17:00',
  recurrenceStartDate: '',
  recurrenceStartTime: '',
  recurrenceEndTime: '',
  recurrencePattern: RecurrencePattern.DAILY,
  recurrenceInterval: 1,
  recurrenceEndDate: '',
  recurrenceCount: 0,
  useEndDate: true,
};
