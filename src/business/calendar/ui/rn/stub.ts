/**
 * RN 端占位：宿主可 import `sa2kit/business/calendar/ui/rn`。
 * 完整 RN UI 待从 calendar-mobile 抽入；过渡期用 WebView 或 domain + 自绘壳。
 */
export const CALENDAR_RN_SUPPORTED = false as const;

export const calendarRnPlatformNote =
  'Calendar RN UI is not implemented yet. Import sa2kit/business/calendar/domain for types/client, or track PLATFORMS.md.';

export function CalendarRnStub(): null {
  return null;
}
