/** teachHub Tailwind 样式常量（由原 teach-hub.css 迁移） */

export const thRoot =
  'flex min-h-screen flex-col bg-[#faf9f7] font-serif text-[#3d3428]';

export const thMain = 'flex min-h-0 min-w-0 flex-1 flex-col';

export const thTopbar =
  'flex items-center justify-between gap-3 border-b border-[#eee8dc] bg-white/95 px-5 py-3';

export const thContentBase = 'mx-auto w-full flex-1 px-4 py-6 pb-8 sm:px-4';

export const thContentHome = `${thContentBase} max-w-[880px]`;
export const thContentWorkspace = `${thContentBase} max-w-[920px]`;
export const thContentWide =
  'flex min-h-0 w-full max-w-none flex-1 flex-col p-0';

export const thHome = 'flex flex-col gap-5';

export const thPageHeader =
  'flex flex-wrap items-start justify-between gap-4';

export const thPageTitle = 'm-0 text-2xl font-bold text-[#3d3428]';

export const thPageDesc =
  'mt-2 max-w-[520px] text-[0.92rem] leading-relaxed text-[#7a6f5c]';

export const thHomeFooter = 'mt-2 text-center text-sm';

export const thHomeFooterLink =
  'text-[#2c5282] no-underline hover:underline';

export const thWsList = 'flex flex-col gap-3';

export const thWsListItemCard = '!p-0';

export const thWsListItemContent = 'flex flex-col gap-3.5 px-[18px] py-4';

export const thWsListItemHead =
  'flex flex-wrap items-start justify-between gap-4';

export const thWsListItemTitle =
  'block text-[1.1rem] font-bold text-[#3d3428] no-underline hover:text-[#2c5282]';

export const thWsListItemMeta =
  'mt-1.5 flex flex-wrap gap-1.5 text-[0.82rem] text-[#7a6f5c]';

export const thWsListItemSummary =
  'mt-2 line-clamp-2 text-[0.88rem] leading-snug text-[#6b5f4d]';

export const thWsListItemProgress =
  'min-w-[140px] max-w-[200px] flex-1 max-sm:w-full max-sm:max-w-none';

export const thWsListItemActions =
  'flex flex-wrap gap-2 border-t border-[#f0ebe3] pt-1';

export const thWsShell = 'flex flex-col gap-5';

export const thWsBreadcrumb =
  'flex flex-wrap items-center gap-2 text-sm text-[#7a6f5c]';

export const thWsBreadcrumbLink =
  'text-[#2c5282] no-underline hover:underline';

export const thWsBreadcrumbCurrent = 'font-semibold text-[#3d3428]';

export const thWsTabs =
  'flex flex-wrap gap-1.5 border-b border-[#e8e2d6] pb-1';

export const thWsTab =
  'rounded-t-lg px-3.5 py-2 text-[0.9rem] text-[#6b5f4d] no-underline transition-colors duration-150 hover:bg-[#f5f1ea] hover:text-[#3d3428]';

export const thWsTabActive =
  'bg-white font-semibold text-[#2c5282] shadow-[inset_0_-2px_0_#4299e1]';

export const thWsBody = 'min-h-[200px]';

export const thOverview = 'flex flex-col gap-4';

export const thPanel =
  'rounded-xl border border-[#e8e2d6] bg-white px-[18px] py-4';

export const thPanelHead =
  'mb-3 flex items-center justify-between gap-3';

export const thPanelTitle = 'm-0 text-[0.95rem] font-bold text-[#5c4f3a]';

export const thPanelLink =
  'text-sm text-[#2c5282] no-underline hover:underline';

export const thPanelBody =
  'm-0 text-[0.92rem] leading-relaxed text-[#6b5f4d]';

export const thOverviewHero =
  'flex flex-wrap items-center justify-between gap-4';

export const thOverviewHeroMain =
  'flex min-w-[200px] max-w-[420px] flex-1 flex-col gap-2.5';

export const thOverviewHeroTopic = 'm-0 text-[0.85rem] text-[#7a6f5c]';

export const thOverviewHeroActions =
  'flex flex-wrap items-start gap-2 max-sm:w-full';

export const thChipList = 'flex flex-wrap gap-2';

export const thChip =
  'rounded-full border border-[#dbe4ef] bg-[#f0f4f8] px-3 py-1.5 text-[0.85rem] text-[#2c5282] no-underline hover:bg-[#e2ecf7]';

export const thTabPage = 'flex flex-col gap-4';

export const thTabPageDesc =
  'm-0 text-[0.9rem] leading-relaxed text-[#7a6f5c]';

export const thSettingsSection = 'flex flex-col gap-3';

export const thSettingsSectionDanger =
  'border-[#fed7d7] bg-[#fffafa]';

export const thEmpty = 'px-4 py-12 text-center text-[#7a6f5c]';

export const thEmptyPanel =
  'rounded-xl border border-dashed border-[#d4c9b5] bg-white';

export const thEmptyInline = 'px-3 py-6 text-left';

export const thLessonList = 'flex flex-col gap-2.5';

export const thLessonItem =
  'flex items-center justify-between gap-3 rounded-[10px] border border-[#e8e2d6] bg-[#faf9f7] px-4 py-3.5 text-inherit no-underline transition-[border-color] duration-150 hover:border-[#c4b89e]';

export const thLessonItemDone =
  'border-[#9ae6b4] bg-[#f0fff4]';

export const thLessonItemTitle = 'font-semibold';

export const thLessonItemMeta = 'text-[0.82rem] text-[#7a6f5c]';

export const thLessonShell =
  'flex min-h-[480px] flex-col h-[calc(100vh-56px)]';

export const thLessonToolbar =
  'flex shrink-0 flex-wrap items-center gap-2.5 border-b border-[#e8e2d6] bg-white px-4 py-2.5';

export const thLessonViewerWrap = 'flex min-h-0 flex-1';

export const thLessonViewerColumn = 'flex min-h-0 flex-1 flex-col';

export const thLessonViewerRow = 'flex min-h-0 flex-1 flex-row';

export const thLessonProgress =
  'shrink-0 bg-[#f5f0e8]/90 backdrop-blur-sm';

export const thLessonProgressShellHorizontal = 'px-4 py-2.5';

export const thLessonProgressShellVertical =
  'flex h-full max-h-full w-[3.25rem] flex-col items-center gap-2 px-2 py-3';

export const thLessonProgressCollapsed =
  'flex shrink-0 items-center justify-between gap-2 bg-[#f5f0e8]/95 px-3 py-1.5';

export const thLessonProgressOverlay =
  'pointer-events-none absolute inset-y-3 z-20 flex items-center';

export const thLessonProgressOverlayLeft = 'left-3';

export const thLessonProgressOverlayRight = 'right-3';

export const thLessonProgressFloatCollapsed =
  'pointer-events-auto flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl border border-[#e8e2d6]/90 bg-[#f5f0e8]/95 p-1 shadow-[0_4px_16px_rgba(61,52,40,0.12)] backdrop-blur-sm';

export const thLessonProgressFloatExpanded =
  'pointer-events-auto flex h-full max-h-full w-[3.25rem] flex-col items-center gap-2 rounded-xl border border-[#e8e2d6]/90 bg-[#f5f0e8]/95 px-2 py-3 shadow-[0_4px_16px_rgba(61,52,40,0.12)] backdrop-blur-sm';

export const thLessonProgressCollapsedVertical =
  'flex shrink-0 flex-col items-center justify-center gap-1 bg-[#f5f0e8]/95 px-1.5 py-2';

export const thLessonProgressToggle =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#e8e2d6] bg-white text-[#7a6f5c] transition-colors hover:border-[#c4b89e] hover:text-[#3d3428]';

export const thLessonProgressRow =
  'mb-2 flex items-baseline justify-between gap-3';

export const thLessonProgressLabel = 'text-xs font-medium tracking-wide text-[#7a6f5c]';

export const thLessonProgressPercent =
  'tabular-nums text-lg font-semibold tracking-tight text-[#3d3428]';

export const thLessonProgressSlider =
  'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e8e2d6] accent-[#4a9b8e] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#4a9b8e] [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(61,52,40,0.2)]';

export const thLessonProgressSliderVertical =
  'h-full min-h-[8rem] w-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#e8e2d6] accent-[#4a9b8e] [writing-mode:vertical-lr] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#4a9b8e] [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(61,52,40,0.2)]';

export const thLessonViewerFrameSlot =
  'order-2 flex min-h-0 min-w-0 flex-1 flex-col';

export const thLessonViewerFrame =
  'min-h-0 min-w-0 flex-1 border-none bg-[#faf9f7]';

export const thForm =
  'flex max-w-[640px] flex-col gap-4';

export const thFormModal = 'max-w-none';

export const thFormLabel =
  'flex flex-col gap-1.5 text-[0.9rem] font-semibold';

export const thFormInput =
  'rounded-lg border border-[#d4c9b5] bg-white px-3 py-2.5 font-[inherit]';

export const thFormTextarea =
  `${thFormInput} min-h-[120px] resize-y`;

export const thSettingsSelect = `${thFormInput} max-w-xs`;

export const thSettingsSwitchRow =
  'flex items-center justify-between gap-4 rounded-lg border border-[#e8e2d6] bg-[#faf9f7] px-3 py-3';

export const thListEditor = 'flex flex-col gap-2';

export const thListEditorRow = 'flex gap-2';

export const thResourcesToolbar =
  'flex flex-wrap items-center justify-between gap-3';

export const thResourcesFilter =
  'rounded-full border border-[#e8e2d6] bg-[#faf9f7] px-3 py-1.5 text-sm text-[#6b5f4d] transition-colors hover:border-[#c4b89e] hover:text-[#3d3428]';

export const thResourcesFilterActive =
  'border-[#4299e1] bg-white font-semibold text-[#2c5282]';

export const thResourcesListScroll =
  'flex max-h-[min(520px,calc(100vh-320px))] flex-col gap-2 overflow-y-auto px-[18px] pb-4';

export const thResourcesNode =
  'flex flex-col gap-2.5 rounded-[10px] border border-[#e8e2d6] bg-[#faf9f7] px-3.5 py-3';

export const thResourcesNodeCollapsed =
  'flex-row items-center justify-between gap-3';

export const thResourcesNodeExpanded = 'flex-col';

export const thResourcesNodeBadge =
  'rounded-full border border-[#dbe4ef] bg-[#f0f4f8] px-2 py-0.5 text-[0.72rem] font-semibold text-[#2c5282]';

export const thResourcesNodeTitle =
  'truncate text-sm font-semibold text-[#3d3428]';

export const thResourcesNodeMeta =
  'truncate text-xs text-[#7a6f5c]';

export const thAuthFallback =
  'flex min-h-screen items-center justify-center bg-[#faf9f7] p-6';

export const thAuthCardText = 'mt-3 leading-relaxed text-[#6b5f4d]';

export const thGuestPage =
  'flex min-h-screen flex-col overflow-x-hidden bg-[#faf9f7] font-serif text-[#3d3428]';

export const thGuestTopbar =
  'flex items-center justify-between gap-3 border-b border-[#eee8dc] bg-white/95 px-4 py-3 sm:px-5';

export const thGuestBrand =
  'm-0 min-w-0 truncate text-[1.05rem] font-bold text-[#3d3428]';

export const thGuestMain =
  'mx-auto flex w-full max-w-[640px] flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10';

export const thGuestPanel =
  'rounded-xl border border-[#e8e2d6] bg-white px-5 py-6 sm:px-6 sm:py-7';

export const thGuestIntro =
  'm-0 text-[0.92rem] leading-relaxed text-[#6b5f4d]';

export const thGuestFeatureList = 'mt-5 flex flex-col gap-2.5';

export const thGuestFeatureItem =
  'flex gap-3 rounded-[10px] border border-[#f0ebe3] bg-[#faf9f7] px-3.5 py-3';

export const thGuestFeatureIcon =
  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6f4f1] text-[#2c7a7b]';

export const thGuestFeatureTitle = 'text-[0.88rem] font-semibold text-[#3d3428]';

export const thGuestFeatureText = 'mt-0.5 text-sm leading-snug text-[#7a6f5c]';

export const thGuestHint =
  'mt-5 border-t border-[#f0ebe3] pt-4 text-center text-sm text-[#7a6f5c]';

export const thGuestHintLink =
  'ml-1 border-none bg-transparent p-0 font-[inherit] text-[#2c5282] underline-offset-2 hover:underline';

export const thMdPreview =
  'whitespace-pre-wrap rounded-[10px] border border-[#e8e2d6] bg-white p-4 text-[0.92rem] leading-relaxed text-[#4a4035]';
