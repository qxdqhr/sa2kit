import {
  bookingMatchesLookup,
} from '../../domain';
import {
  BookingCommandError,
  createBookingCommandService,
  type BookingDeleteCredentials,
  type DeleteBookingOptions,
} from './bookingCommandService';
import { createBookingQueryService } from './bookingQueryService';

export type DeleteBookingGuardOptions = {
  isAdmin: boolean;
  credentials: BookingDeleteCredentials | null;
};

/**
 * 删单：先宿主侧凭证校验，再 Command 层二次校验。
 */
export async function deleteBookingWithCredentialGuard(
  db: unknown,
  id: number,
  options: DeleteBookingGuardOptions,
): Promise<void> {
  const query = createBookingQueryService(db);
  const command = createBookingCommandService(db);

  const booking = await query.getBookingById(id);
  if (!booking) {
    throw new BookingCommandError('BOOKING_NOT_FOUND', '预订不存在');
  }

  if (!options.isAdmin) {
    const { credentials } = options;
    if (
      !credentials ||
      !bookingMatchesLookup(
        booking,
        credentials.qqNumber,
        credentials.phoneNumber,
      )
    ) {
      throw new BookingCommandError(
        'INVALID_PAYLOAD',
        '删除预订请同时提供匹配的 QQ 号与手机号',
      );
    }
  }

  const deleteOptions: DeleteBookingOptions | undefined = options.isAdmin
    ? { asAdmin: true }
    : options.credentials
      ? {
          credentials: {
            qqNumber: options.credentials.qqNumber,
            phoneNumber: options.credentials.phoneNumber,
          },
        }
      : undefined;

  await command.deleteBooking(id, deleteOptions);
}

export function isBookingDeleteUnauthorized(
  error: BookingCommandError,
): boolean {
  return (
    error.code === 'UNAUTHORIZED' ||
    (error.code === 'INVALID_PAYLOAD' &&
      error.message.includes('删除预订'))
  );
}
