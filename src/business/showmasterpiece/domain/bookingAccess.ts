/**
 * 用户自助查询须同时提供 QQ 与手机号，降低枚举他人订单的风险。
 */
export function validatePublicBookingLookup(params: {
  qqNumber?: string;
  phoneNumber?: string;
}): string | null {
  const qq = params.qqNumber?.trim();
  const phone = params.phoneNumber?.trim();

  if (!qq || !phone) {
    return '查询预订请同时填写 QQ 号与手机号';
  }

  return null;
}

export function bookingMatchesLookup(
  booking: { qqNumber?: string | null; phoneNumber?: string | null },
  qqNumber: string,
  phoneNumber: string,
): boolean {
  const qq = (booking.qqNumber ?? '').trim();
  const phone = (booking.phoneNumber ?? '').trim();
  return qq === qqNumber.trim() && phone === phoneNumber.trim();
}
