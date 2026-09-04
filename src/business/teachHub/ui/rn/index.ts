/**
 * RN 端占位：`sa2kit/business/teachHub/ui/rn`。
 * teach-hub-mobile 过渡期继续经 @profile/teach-hub-core/shared → domain。
 */
export const TEACH_HUB_RN_SUPPORTED = false as const;

export const teachHubRnPlatformNote =
  'TeachHub RN UI is not implemented yet. Use domain types + host shell, or track PLATFORMS.md.';

export function TeachHubRnStub(): null {
  return null;
}
