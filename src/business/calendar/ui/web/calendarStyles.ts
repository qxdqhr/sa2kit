import { cn } from './utils/cn';

/** Layout */
export const cal = {
  root: cn(
    'relative h-dvh min-h-dvh overflow-hidden bg-[#f8f8f0] text-[#725d42]',
    "font-[family-name:var(--font-cal-nunito),var(--font-cal-noto),-apple-system,'PingFang_SC','Hiragino_Sans_GB','Microsoft_YaHei',sans-serif]",
  ),
  main: cn(
    'mx-auto flex h-full max-w-7xl flex-col overflow-hidden px-3 pb-4 pt-3',
    'sm:px-5 sm:pb-5 sm:pt-4',
    'lg:px-8 lg:pb-6',
  ),
  panel: 'rounded-[20px] border-2 border-[#9f927d] bg-[rgb(247,243,223)] text-[#725d42]',
  panelFlush: 'overflow-hidden p-0',
  surface: 'min-h-0 flex-1 overflow-auto rounded-[20px] border-2 border-[#9f927d] bg-[rgb(247,243,223)]',
  surfaceWeek: 'flex flex-col overflow-hidden',
  header: 'mb-3',
  headerRow: 'flex items-center justify-between gap-3',
  nav: cn(
    'flex gap-1 overflow-x-auto overflow-y-hidden rounded-[20px] border-2 border-[#9f927d] bg-white/55 p-1.5',
    '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
    'max-sm:gap-0.5 max-sm:overflow-x-hidden max-sm:p-1',
  ),
  navItem: cn(
    'inline-flex h-10 min-w-0 flex-1 basis-0 cursor-pointer items-center justify-center gap-1.5 rounded-[50px] border-none bg-transparent px-3.5 text-sm font-semibold text-[#8a7b66]',
    'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
    'hover:bg-[rgba(25,200,185,0.1)] hover:text-[#725d42]',
    'max-sm:h-[34px] max-sm:gap-1 max-sm:px-1.5 max-sm:text-xs',
    'max-sm:[&_svg]:h-3.5 max-sm:[&_svg]:w-3.5',
    'max-sm:[&_span]:truncate',
  ),
  navItemActive: 'bg-[#0cc0b5] text-[#fff9e3] hover:bg-[#0cc0b5] hover:text-[#fff9e3]',
  navItemLabel: 'min-w-0',
  toolbar: 'px-4 py-3 sm:px-[18px] sm:py-3.5',
  toolbarInner: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
  toolbarTitleRow: 'flex items-center justify-between gap-2 sm:justify-start',
  toolbarTitle: 'min-w-0 flex-1 text-center text-base font-bold text-[#794f27] sm:min-w-40 sm:text-lg',
  toolbarActions: 'flex items-center justify-center gap-2',
  segmented: 'inline-flex rounded-[50px] border-2 border-[#c4b89e] bg-white/65 p-[3px]',
  segmentedBtn:
    'h-8 min-w-9 cursor-pointer rounded-[50px] border-none bg-transparent px-3 text-sm font-semibold text-[#8a7b66] transition-all duration-200 ease-in-out',
  segmentedBtnActive: 'bg-[#0cc0b5] text-[#fff9e3]',
  alert: 'mt-3 flex items-start justify-between gap-3 rounded-[18px] px-4 py-3 text-sm font-medium',
  alertError: 'border-2 border-[rgba(224,90,90,0.35)] bg-[rgba(224,90,90,0.12)] text-[#9a3f3f]',
  alertWarn: 'border-2 border-[rgba(245,195,28,0.45)] bg-[rgba(245,195,28,0.15)] text-[#7a5a10]',
  fab: 'fixed bottom-6 right-4 z-30 sm:bottom-8 sm:right-8',
  toast: cn(
    'fixed bottom-6 left-1/2 z-60 max-w-[90vw] -translate-x-1/2 rounded-[50px] border-2 border-[#6fba2c] bg-[#e6f9f6] px-5 py-2.5 text-sm font-semibold text-[#3d5a1a]',
    'shadow-[0_3px_10px_rgba(61,52,40,0.1)]',
  ),
  toastError: 'border-[#e05a5a] bg-[rgba(224,90,90,0.12)] text-[#9a3f3f]',
  loadingWrap: 'relative min-h-[200px] overflow-hidden rounded-[20px]',
  empty: 'px-4 py-10 text-center text-sm text-[#9f927d]',
  locationLink: cn(
    'flex min-w-0 items-center gap-1 border-none bg-transparent p-0 text-left text-inherit font-semibold text-[#11a89b] underline decoration-[rgba(25,200,185,0.45)] underline-offset-2',
    'cursor-pointer hover:text-[#19c8b9]',
  ),
  locationLinkGrid: 'text-[11px] font-semibold [&_svg]:h-3 [&_svg]:w-3',
  eventCard: cn(
    'rounded-[18px] p-4 transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5',
  ),
  eventGrid: 'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-4 lg:gap-3',
  eventCardGrid: cn(
    'flex min-h-0 flex-col rounded-[14px] p-2.5 transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px',
  ),
  eventCardGridHead: 'mb-1.5 flex items-start gap-1.5',
  eventCardGridCheck: 'pt-0.5',
  eventCardTitle: 'min-w-0 flex-1 text-[13px] font-bold leading-[1.35] text-[#794f27]',
  eventCardPriority: 'shrink-0 rounded-md px-1.5 py-px text-[10px] font-bold leading-[1.4]',
  eventCardDesc: 'mb-1.5 line-clamp-2 overflow-hidden text-[11px] leading-[1.4] text-[#725d42]',
  eventCardMeta: 'mt-auto flex flex-col gap-1 text-[11px] text-[#9f927d]',
  eventCardMetaRow: 'flex min-w-0 items-center gap-1',
  eventCardMetaIcon: 'h-3 w-3 shrink-0',
  eventCardGridActions: 'mt-1.5 flex items-center justify-end gap-0.5 border-t border-dashed border-[rgb(240,232,216)] pt-1.5',
  eventSurfaceBlue: 'bg-[rgba(136,157,240,0.18)] text-[#4a5f9c] shadow-[inset_0_0_0_1.5px_rgba(136,157,240,0.35)]',
  eventSurfaceGreen: 'bg-[rgba(138,198,138,0.2)] text-[#3d6b3d] shadow-[inset_0_0_0_1.5px_rgba(111,186,44,0.35)]',
  eventSurfaceRed: 'bg-[rgba(252,115,109,0.16)] text-[#9a3f3f] shadow-[inset_0_0_0_1.5px_rgba(224,90,90,0.35)]',
  eventSurfacePurple: 'bg-[rgba(183,125,238,0.16)] text-[#6b3f9a] shadow-[inset_0_0_0_1.5px_rgba(183,125,238,0.35)]',
  eventSurfaceYellow: 'bg-[rgba(247,205,103,0.22)] text-[#7a5a10] shadow-[inset_0_0_0_1.5px_rgba(245,195,28,0.4)]',
  eventSurfacePink: 'bg-[rgba(248,166,178,0.2)] text-[#a85565] shadow-[inset_0_0_0_1.5px_rgba(248,166,178,0.45)]',
  eventSurfaceIndigo: 'bg-[rgba(130,213,187,0.18)] text-[#2f6f5f] shadow-[inset_0_0_0_1.5px_rgba(25,200,185,0.35)]',
  eventSurfaceGray: 'bg-[rgba(196,184,158,0.2)] text-[#725d42] shadow-[inset_0_0_0_1.5px_rgba(159,146,125,0.35)]',
  priorityUrgent: 'rounded-lg px-2 py-0.5 text-xs font-bold bg-[rgba(224,90,90,0.15)] text-[#9a3f3f]',
  priorityHigh: 'rounded-lg px-2 py-0.5 text-xs font-bold bg-[rgba(229,146,102,0.2)] text-[#8a4a28]',
  priorityLow: 'rounded-lg px-2 py-0.5 text-xs font-bold bg-[rgba(196,184,158,0.25)] text-[#8a7b66]',
  priorityNormal: 'rounded-lg px-2 py-0.5 text-xs font-bold bg-[rgba(25,200,185,0.15)] text-[#117a72]',
  label: 'text-sm font-semibold text-[#794f27]',
  hint: 'text-xs text-[#9f927d]',
  section: 'rounded-[18px] border-2 border-[#e8dcc8] bg-[rgb(250,248,242)] p-4',
  input: cn(
    'w-full rounded-[50px] border-[2.5px] border-[#c4b89e] bg-[rgb(247,243,223)] px-[18px] py-2.5 text-sm font-medium tracking-[0.01em] text-[#725d42]',
    'font-[inherit] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
    'hover:border-[#a89878] focus:border-[#ffcc00] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,204,0,0.15)]',
  ),
  textarea: cn(
    'w-full resize-none rounded-[18px] border-[2.5px] border-[#c4b89e] bg-[rgb(247,243,223)] text-sm font-medium leading-relaxed tracking-[0.01em] text-[#725d42]',
    'font-[inherit] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
    'hover:border-[#a89878] focus:border-[#ffcc00] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,204,0,0.15)]',
  ),
  textareaShort: 'min-h-[4.5rem] max-h-[4.5rem] overflow-y-auto px-[18px] py-3',
  textareaTall: 'min-h-[7.5rem] max-h-40 overflow-y-auto px-[18px] py-3',
  inputError: 'border-[#e05a5a] shadow-[0_3px_0_0_#c94444]',
  modalActions: 'flex items-center justify-end gap-2',
  modalActionsBetween: 'justify-between',
  sheetBackdrop: 'fixed inset-0 z-40 border-none bg-black/35',
  sheet: cn(
    'fixed inset-x-0 bottom-0 z-50 flex max-h-[min(85vh,640px)] flex-col rounded-t-[24px] border-2 border-b-0 border-[#9f927d] bg-[rgb(247,243,223)] text-[#725d42]',
    'md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:max-h-[min(80vh,560px)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:border-b-2',
  ),
  sheetHandle: 'mx-auto mb-0 mt-3 h-1 w-10 rounded-[50px] bg-[#c4b89e]',
  sheetHeader: 'flex items-start justify-between gap-3 border-b-2 border-[#e8dcc8] px-5 py-4',
  sheetBody: 'flex-1 overflow-y-auto px-5 py-3',
  sheetFooter: 'border-t-2 border-[#e8dcc8] px-5 py-4',
  gridHint: 'hidden border-b-2 border-[#e8dcc8] px-4 py-2 text-xs text-[#9f927d] md:block',
  cellOverflow: cn(
    'cursor-pointer rounded-lg border-none bg-transparent px-1 py-0.5 text-left text-[10px] font-semibold text-[#11a89b]',
    'hover:bg-[rgba(25,200,185,0.12)]',
  ),
  dragHint: cn(
    'fixed bottom-20 right-4 z-50 rounded-[18px] border-2 border-[#11a89b] bg-[#19c8b9] px-4 py-2 text-sm font-semibold text-[#fff9e3]',
    'shadow-[0_3px_10px_rgba(61,52,40,0.12)]',
  ),
  mapOption: cn(
    'flex w-full cursor-pointer flex-col items-start rounded-[18px] border-2 border-[#c4b89e] bg-[rgb(250,248,242)] px-4 py-3 text-left transition-all duration-200 ease-in-out',
    'hover:-translate-y-px hover:border-[#19c8b9]',
  ),
  mapOptionAmap: 'border-[#82d5bb] bg-[rgba(130,213,187,0.12)]',
  mapOptionBaidu: 'border-[#889df0] bg-[rgba(136,157,240,0.12)]',
  mapOptionGoogle: 'border-[#6fba2c] bg-[rgba(111,186,44,0.12)]',
  settingsTabs: cn(
    'flex gap-1 overflow-x-auto overflow-y-hidden border-b-2 border-[#e8dcc8] px-4 pb-0 pt-2',
    '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
    'max-sm:gap-0 max-sm:overflow-x-hidden max-sm:px-2 max-sm:pt-1.5',
  ),
  settingsTab: cn(
    'min-w-0 flex-1 basis-0 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap border-none border-b-[3px] border-transparent bg-transparent px-4 py-3 text-center text-sm font-semibold text-[#9f927d]',
    'max-sm:px-1 max-sm:py-2.5 max-sm:text-xs',
  ),
  settingsTabActive: 'border-b-[#19c8b9] text-[#794f27]',
  themeCard: cn(
    'cursor-pointer rounded-[18px] border-2 border-[#e8dcc8] p-4 transition-all duration-200 ease-in-out hover:border-[#c4b89e]',
  ),
  themeCardSelected: 'border-[#19c8b9] bg-[rgba(230,249,246,0.6)]',
  listToolbar: 'p-4 max-sm:p-3 max-sm:[&_.cal-sort-mobile]:px-2 max-sm:[&_.cal-sort-mobile]:py-1 max-sm:[&_.cal-sort-mobile]:text-xs',
  sortBtn: cn(
    'cal-sort-mobile inline-flex cursor-pointer items-center rounded-[50px] border-none bg-transparent px-3 py-1.5 text-sm font-semibold text-[#8a7b66]',
  ),
  sortBtnActive: 'bg-[rgba(25,200,185,0.15)] text-[#117a72]',
  weekHeader: 'shrink-0 border-b-2 border-[#e8dcc8] bg-white/50 px-5 py-3',
  weekDayRow: 'border-b-2 border-dashed border-[rgb(240,232,216)] last:border-b-0',
  dayHeader: 'border-b-2 border-[#e8dcc8] bg-white/50 p-4 text-center',
  addDashed: cn(
    'flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#c4b89e] bg-transparent text-sm font-semibold text-[#11a89b]',
    'transition-all duration-200 ease-in-out hover:border-[#19c8b9] hover:bg-[rgba(230,249,246,0.5)]',
  ),
  eventModalBody: 'max-h-[58vh] min-h-[280px] overflow-y-auto',
  eventModalBodyMobile: 'max-h-[calc(100dvh-11rem)] flex-1',
  eventTabbar: cn(
    'flex gap-1 overflow-x-auto overflow-y-hidden rounded-[18px] border-2 border-[#c4b89e] bg-white/55 p-1',
    '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
    'max-sm:gap-0.5 max-sm:overflow-x-hidden max-sm:p-[3px]',
  ),
  eventTab: cn(
    'relative flex h-10 min-w-0 flex-1 basis-0 cursor-pointer items-center justify-center gap-1.5 rounded-[14px] border-none bg-transparent text-sm font-semibold text-[#8a7b66]',
    'max-sm:h-[34px] max-sm:gap-1 max-sm:text-xs max-sm:[&_svg]:h-3.5 max-sm:[&_svg]:w-3.5',
  ),
  eventTabActive: 'bg-[#0cc0b5] text-[#fff9e3]',
  errorBox: 'flex items-start gap-3 rounded-[18px] border-2 border-[rgba(224,90,90,0.3)] bg-[rgba(224,90,90,0.1)] px-4 py-3 text-sm text-[#9a3f3f]',
  monthWrap: 'overflow-hidden rounded-[20px] bg-[rgb(247,243,223)]',
  monthTheadTh: 'border-b-2 border-[#e8dcc8] bg-white/50 px-0 py-2 text-xs font-bold text-[#8a7b66] sm:text-sm',
  monthRowCell: 'border-b border-dashed border-[rgb(240,232,216)] [&+&]:border-l [&+&]:border-dashed [&+&]:border-[rgb(240,232,216)]',
  weekNum: 'bg-[rgba(248,248,240,0.8)] font-semibold text-[#9f927d]',
  textMuted: 'text-[#9f927d]',
  textBody: 'text-[#725d42]',
  textHeading: 'font-bold text-[#794f27]',
  selectedRing: 'shadow-[inset_0_0_0_2px_#19c8b9]',
  dividerTop: 'border-t-2 border-dashed border-[rgb(240,232,216)]',
  stats: 'text-sm text-[#9f927d]',
  paginationBtn: cn(
    'cursor-pointer rounded-[50px] border-2 border-[#c4b89e] bg-[rgb(247,243,223)] px-4 py-1.5 text-sm font-semibold text-[#725d42] transition-all duration-200 ease-in-out',
    'hover:border-[#19c8b9] hover:text-[#11a89b] disabled:cursor-not-allowed disabled:opacity-50',
  ),
  checkbox: 'h-[22px] w-[22px] cursor-pointer accent-[#19c8b9]',
  aiPreview: 'mt-3 flex items-center gap-3 rounded-[18px] border-2 border-[rgba(25,200,185,0.35)] bg-[rgba(230,249,246,0.6)] px-3 py-2 [&_img]:h-12 [&_img]:w-12 [&_img]:rounded-xl [&_img]:object-cover',
  typeOption: cn(
    'relative flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-[18px] border-2 border-[#e8dcc8] bg-[rgb(250,248,242)] px-2 text-sm font-semibold text-[#8a7b66] transition-all duration-200 ease-in-out',
  ),
  typeOptionActive: 'border-[#19c8b9] bg-[rgba(230,249,246,0.8)] text-[#117a72] shadow-[inset_0_0_0_1.5px_rgba(25,200,185,0.35)]',
  typeOptionMultiActive: 'border-[#6fba2c] bg-[rgba(138,198,138,0.15)] text-[#3d6b3d]',
  typeOptionRepeatActive: 'border-[#889df0] bg-[rgba(136,157,240,0.15)] text-[#4a5f9c]',
  infoBox: 'flex items-start gap-2 rounded-[18px] border-2 border-[rgba(25,200,185,0.3)] bg-[rgba(230,249,246,0.5)] px-3 py-2.5',
  priorityChip: cn(
    'cursor-pointer rounded-[50px] border-2 border-[#e8dcc8] bg-[rgb(250,248,242)] px-3.5 py-1.5 text-sm font-semibold text-[#8a7b66] transition-all duration-200 ease-in-out',
  ),
  priorityChipActive: 'border-[#19c8b9] bg-[rgba(230,249,246,0.7)] text-[#117a72]',
  listToolbarSegmentedBtn: 'max-sm:min-w-8 max-sm:h-7 max-sm:px-2.5 max-sm:text-xs',
  scrollHidden:
    '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
  scrollY: 'min-h-0 flex-1 overflow-y-auto',
} as const;

export type EventSurfaceKey =
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'yellow'
  | 'pink'
  | 'indigo'
  | 'gray';

export type TypeOptionVariant = 'default' | 'multi' | 'repeat';

export type MapProvider = 'amap' | 'baidu' | 'google';

const eventSurfaceMap: Record<EventSurfaceKey, string> = {
  blue: cal.eventSurfaceBlue,
  green: cal.eventSurfaceGreen,
  red: cal.eventSurfaceRed,
  purple: cal.eventSurfacePurple,
  yellow: cal.eventSurfaceYellow,
  pink: cal.eventSurfacePink,
  indigo: cal.eventSurfaceIndigo,
  gray: cal.eventSurfaceGray,
};

export function navItemClass(active?: boolean) {
  return cn(cal.navItem, active && cal.navItemActive);
}

export function segmentedBtnClass(active?: boolean, inListToolbar = false) {
  return cn(
    cal.segmentedBtn,
    inListToolbar && cal.listToolbarSegmentedBtn,
    active && cal.segmentedBtnActive,
  );
}

export function settingsTabClass(active?: boolean) {
  return cn(cal.settingsTab, active && cal.settingsTabActive);
}

export function eventTabClass(active?: boolean) {
  return cn(cal.eventTab, active && cal.eventTabActive);
}

export function sortBtnClass(active?: boolean) {
  return cn(cal.sortBtn, active && cal.sortBtnActive);
}

export function typeOptionClass(variant: TypeOptionVariant, active?: boolean) {
  return cn(
    cal.typeOption,
    active && variant === 'default' && cal.typeOptionActive,
    active && variant === 'multi' && cal.typeOptionMultiActive,
    active && variant === 'repeat' && cal.typeOptionRepeatActive,
  );
}

export function priorityChipClass(active?: boolean) {
  return cn(cal.priorityChip, active && cal.priorityChipActive);
}

export function mapOptionClass(provider: MapProvider) {
  return cn(
    cal.mapOption,
    provider === 'amap' && cal.mapOptionAmap,
    provider === 'baidu' && cal.mapOptionBaidu,
    provider === 'google' && cal.mapOptionGoogle,
  );
}

export function themeCardClass(selected?: boolean) {
  return cn(cal.themeCard, selected && cal.themeCardSelected);
}

export function eventSurfaceClass(key: EventSurfaceKey) {
  return eventSurfaceMap[key];
}

export function priorityBadgeClass(
  priority: 'urgent' | 'high' | 'low' | 'normal',
) {
  const map = {
    urgent: cal.priorityUrgent,
    high: cal.priorityHigh,
    low: cal.priorityLow,
    normal: cal.priorityNormal,
  } as const;
  return map[priority];
}

export function inputClass(hasError?: boolean) {
  return cn(cal.input, hasError && cal.inputError);
}

export function textareaClass(variant: 'short' | 'tall' = 'short', hasError?: boolean) {
  return cn(
    cal.textarea,
    variant === 'short' ? cal.textareaShort : cal.textareaTall,
    hasError && cal.inputError,
  );
}

export function toastClass(isError?: boolean) {
  return cn(cal.toast, isError && cal.toastError);
}

export function modalActionsClass(between?: boolean) {
  return cn(cal.modalActions, between && cal.modalActionsBetween);
}

export function eventModalBodyClass(isMobile?: boolean) {
  return cn(cal.eventModalBody, isMobile && cal.eventModalBodyMobile);
}
