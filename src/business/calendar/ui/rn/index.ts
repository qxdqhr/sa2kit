/**
 * RN 端入口：`sa2kit/business/calendar/ui/rn`
 *
 * 原生日历 UI 仍由 calendar-mobile 自绘；跨端类型与 API 客户端请从 domain 取
 *（本入口亦 re-export domain，便于 `ui/rn` 单路径依赖）。
 */
export {
  CALENDAR_RN_SUPPORTED,
  calendarRnPlatformNote,
  CalendarRnStub,
} from './stub';

export * from '../../domain';
