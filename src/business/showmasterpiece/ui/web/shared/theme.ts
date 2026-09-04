/**
 * ShowMasterpiece UI 设计 token（make-interfaces-feel-better）
 * Web / 小程序 / 管理端共用色板与交互类名
 */

/** 组合 className */
export function smCn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export const sm = {
  /** 页面 */
  screen:
    'min-h-screen bg-gradient-to-b from-prussian-blue-50/90 via-white to-white antialiased',
  screenMuted: 'min-h-screen bg-prussian-blue-50/40',

  /** 表面：阴影优于硬边框 */
  card:
    'overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] ring-1 ring-black/5',
  cardLg:
    'overflow-hidden rounded-3xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5',
  cardCompact:
    'rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/5',
  cardInteractive:
    'cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(30,136,229,0.12)] active:scale-[0.98]',

  panel:
    'rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5 sm:p-6',
  panelInset: 'rounded-xl bg-prussian-blue-50/50 p-4 ring-1 ring-prussian-blue-200/40',

  /** 图片描边 */
  imgCover: 'outline outline-1 outline-black/10',
  imgThumb: 'rounded-xl outline outline-1 outline-black/10',
  imgPlaceholder:
    'flex items-center justify-center bg-gradient-to-br from-prussian-blue-100 to-oxford-blue-100 text-xs text-prussian-blue-500',

  /** 排版 */
  title: 'text-balance font-bold text-rich-black tracking-tight',
  titleSm: 'text-balance text-sm font-semibold text-rich-black',
  titleLg: 'text-balance text-xl font-bold text-rich-black sm:text-2xl',
  subtitle: 'text-pretty text-sm text-prussian-blue-600',
  meta: 'text-xs text-prussian-blue-600',
  price: 'tabular-nums text-sm font-medium text-prussian-blue-700',
  priceLg: 'tabular-nums text-base font-semibold text-prussian-blue-800',

  /** 按钮（最小 40px 点击区） */
  btnPrimary:
    'flex h-10 min-h-10 items-center justify-center rounded-full bg-gradient-to-r from-moonstone to-cerulean px-4 shadow-[0_2px_10px_rgba(30,136,229,0.35)] transition-transform duration-200 active:scale-[0.96]',
  btnPrimaryFlex: 'flex-1',
  btnGhost:
    'flex h-10 min-h-10 items-center justify-center rounded-full border border-prussian-blue-200/80 bg-white px-4 shadow-sm transition-transform duration-200 active:scale-[0.96]',
  btnGhostFlex: 'flex-1',
  btnDanger:
    'flex h-10 min-h-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 transition-transform duration-200 active:scale-[0.96]',
  btnIcon:
    'flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full border border-prussian-blue-200/80 bg-white text-prussian-blue-700 shadow-sm transition-transform duration-200 active:scale-[0.96]',

  btnTextPrimary: 'text-xs font-semibold text-white sm:text-sm',
  btnTextGhost: 'text-xs font-semibold text-prussian-blue-700 sm:text-sm',
  btnTextDanger: 'text-xs font-semibold text-rose-600',

  /** Web：叠加到 @/components Button */
  webBtnPrimary:
    'rounded-full bg-gradient-to-r from-moonstone to-cerulean shadow-[0_2px_10px_rgba(30,136,229,0.3)] transition-transform duration-200 active:scale-[0.96] hover:from-cerulean hover:to-moonstone',
  webBtnSecondary:
    'rounded-full border-prussian-blue-200/80 shadow-sm transition-transform duration-200 active:scale-[0.96]',
  webCard:
    'border-prussian-blue-200/30 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-300',
  webCardHover:
    'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(30,136,229,0.12)] hover:ring-moonstone/20',

  /** 分类 Tab（小程序） */
  tab:
    'flex h-20 w-28 shrink-0 flex-col justify-between rounded-2xl border px-3 py-3 transition-[transform,box-shadow,border-color] duration-200 active:scale-[0.98]',
  tabActive:
    'border-sky-500 bg-gradient-to-br from-sky-500 to-cerulean text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)]',
  tabInactive:
    'border-prussian-blue-200/80 bg-white text-prussian-blue-700 shadow-sm hover:border-prussian-blue-300',
  tabCountActive: 'rounded-full bg-white/95 px-2 py-1 text-xs tabular-nums text-sky-600',
  tabCountInactive:
    'rounded-full bg-prussian-blue-100 px-2 py-1 text-xs tabular-nums text-prussian-blue-700',

  /** 表单 */
  label: 'text-sm font-medium text-prussian-blue-700',
  input:
    'mt-2 h-11 w-full rounded-2xl border border-prussian-blue-200/80 bg-white px-3 text-sm shadow-sm transition-[box-shadow,border-color] duration-200 focus:border-moonstone/50 focus:outline-none focus:ring-2 focus:ring-moonstone/25',
  inputError: 'border-rose-300 focus:ring-rose-200/50',
  textarea:
    'mt-2 min-h-24 w-full rounded-2xl border border-prussian-blue-200/80 bg-white px-3 py-2 text-sm shadow-sm transition-[box-shadow,border-color] duration-200 focus:border-moonstone/50 focus:outline-none focus:ring-2 focus:ring-moonstone/25',
  fieldError: 'mt-1 block text-xs text-rose-600',

  /** 顶栏 */
  header:
    'border-b border-prussian-blue-200/50 bg-white/90 px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md',

  /** 管理端 */
  adminStatCard:
    'rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] ring-1 ring-black/5 sm:p-6',
  adminStatValue: 'text-balance text-lg font-bold tabular-nums text-rich-black sm:text-2xl',
  adminStatLabel: 'text-pretty text-xs text-prussian-blue-600 sm:text-sm',
  adminIconWrap: 'rounded-xl p-2.5',
  adminPanel: 'rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5',
  adminInput:
    'w-full rounded-xl border border-prussian-blue-200/80 bg-white px-3 py-2.5 text-sm shadow-sm transition-[box-shadow,border-color] duration-200 focus:border-moonstone/50 focus:outline-none focus:ring-2 focus:ring-moonstone/25',
  adminLabel: 'mb-2 block text-sm font-medium text-prussian-blue-700',
  adminTableRow: 'transition-colors duration-150 hover:bg-prussian-blue-50/60',
  adminBadge: 'tabular-nums rounded-full px-2.5 py-0.5 text-xs font-medium',

  /** 空态 / 加载 */
  empty: 'rounded-2xl bg-white/80 p-8 text-center text-sm text-prussian-blue-600 ring-1 ring-black/5',
  spinner:
    'h-8 w-8 animate-spin rounded-full border-2 border-prussian-blue-200 border-t-moonstone',
} as const;
