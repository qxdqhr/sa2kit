/**
 * RN 端占位：证明宿主可 import `sa2kit/business/festivalCard/ui/rn`。
 * 完整 RN 渲染待后续迭代；当前建议在 RN 壳内嵌 WebView 加载 web UI。
 */
export const FESTIVAL_CARD_RN_SUPPORTED = false as const;

export const festivalCardRnPlatformNote =
  'Festival Card RN UI is not implemented yet. Use sa2kit/business/festivalCard/ui/web in a WebView, or track PLATFORMS.md.';

export function FestivalCardRnStub(): null {
  return null;
}
