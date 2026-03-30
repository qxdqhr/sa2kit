import { and, eq } from 'drizzle-orm';
import { comicUniverseBookings } from '../schema/bookings';
import { comicUniverseCollections } from '../schema/masterpieces';

export type BookingCommandErrorCode =
  | 'INVALID_BOOKING_ID'
  | 'BOOKING_NOT_FOUND'
  | 'INVALID_PAYLOAD'
  | 'INVALID_PHONE'
  | 'INVALID_QQ'
  | 'INVALID_QUANTITY'
  | 'COLLECTION_NOT_FOUND'
  | 'INVALID_STATUS';

export class BookingCommandError extends Error {
  constructor(public readonly code: BookingCommandErrorCode, message: string) {
    super(message);
    this.name = 'BookingCommandError';
  }
}

export class BookingCommandService {
  constructor(private readonly db: any) {}

  private async ensureBookingExists(id: number): Promise<void> {
    const existingBooking = await this.db
      .select({ id: comicUniverseBookings.id })
      .from(comicUniverseBookings)
      .where(eq(comicUniverseBookings.id, id))
      .limit(1);

    if (existingBooking.length === 0) {
      throw new BookingCommandError('BOOKING_NOT_FOUND', '预订不存在');
    }
  }

  private async ensureCollectionExists(collectionId: number): Promise<void> {
    const collection = await this.db
      .select({ id: comicUniverseCollections.id })
      .from(comicUniverseCollections)
      .where(eq(comicUniverseCollections.id, collectionId))
      .limit(1);

    if (collection.length === 0) {
      throw new BookingCommandError('COLLECTION_NOT_FOUND', '画集不存在');
    }
  }

  private validatePhone(phoneNumber: string): void {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new BookingCommandError('INVALID_PHONE', '手机号格式不正确');
    }
  }

  private validateQq(qqNumber: string): void {
    const qqRegex = /^\d{5,11}$/;
    if (!qqRegex.test(qqNumber)) {
      throw new BookingCommandError('INVALID_QQ', 'QQ号格式不正确');
    }
  }

  async createBooking(body: any): Promise<any> {
    if (!body.collectionId || !body.qqNumber || !body.phoneNumber || !body.quantity) {
      throw new BookingCommandError('INVALID_PAYLOAD', '缺少必要参数：画集ID、QQ号、手机号、预订数量');
    }

    this.validatePhone(body.phoneNumber);
    this.validateQq(body.qqNumber);

    if (body.quantity < 1) {
      throw new BookingCommandError('INVALID_QUANTITY', '预订数量必须大于0');
    }

    await this.ensureCollectionExists(body.collectionId);

    const existingBooking = await this.db
      .select({
        id: comicUniverseBookings.id,
        quantity: comicUniverseBookings.quantity,
        notes: comicUniverseBookings.notes,
      })
      .from(comicUniverseBookings)
      .where(
        and(
          eq(comicUniverseBookings.qqNumber, body.qqNumber),
          eq(comicUniverseBookings.phoneNumber, body.phoneNumber),
          eq(comicUniverseBookings.collectionId, body.collectionId),
        ),
      )
      .limit(1);

    let resultBooking;

    if (existingBooking.length > 0) {
      const existing = existingBooking[0];
      const newQuantity = existing.quantity + body.quantity;
      const combinedNotes = existing.notes
        ? `${existing.notes}; 新增预订: ${body.notes || '无备注'}`
        : body.notes || null;

      const [updatedBooking] = await this.db
        .update(comicUniverseBookings)
        .set({
          quantity: newQuantity,
          notes: combinedNotes,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(comicUniverseBookings.qqNumber, body.qqNumber),
            eq(comicUniverseBookings.phoneNumber, body.phoneNumber),
            eq(comicUniverseBookings.collectionId, body.collectionId),
          ),
        )
        .returning();

      resultBooking = updatedBooking;
    } else {
      const [newBooking] = await this.db
        .insert(comicUniverseBookings)
        .values({
          collectionId: body.collectionId,
          qqNumber: body.qqNumber,
          phoneNumber: body.phoneNumber,
          quantity: body.quantity,
          notes: body.notes || null,
          status: 'pending',
        })
        .returning();

      resultBooking = newBooking;
    }

    return {
      id: resultBooking.id,
      collectionId: resultBooking.collectionId,
      qqNumber: resultBooking.qqNumber,
      phoneNumber: resultBooking.phoneNumber,
      quantity: resultBooking.quantity,
      status: resultBooking.status,
      notes: resultBooking.notes,
      createdAt:
        resultBooking.createdAt instanceof Date
          ? resultBooking.createdAt.toISOString()
          : resultBooking.createdAt,
      updatedAt:
        resultBooking.updatedAt instanceof Date
          ? resultBooking.updatedAt.toISOString()
          : resultBooking.updatedAt,
    };
  }

  async batchCreateBookings(body: any): Promise<any> {
    const { qqNumber, phoneNumber, items, notes, pickupMethod } = body;

    if (!qqNumber || !phoneNumber || !Array.isArray(items) || items.length === 0) {
      throw new BookingCommandError('INVALID_PAYLOAD', '缺少必要参数：QQ号、手机号、预订项列表');
    }

    this.validateQq(qqNumber);
    this.validatePhone(phoneNumber);

    const bookingIds: number[] = [];
    const failures: { collectionId: number; reason: string }[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        if (!item.collectionId || !item.quantity) {
          failures.push({ collectionId: item.collectionId, reason: '缺少必要参数' });
          failCount++;
          continue;
        }

        if (item.quantity < 1) {
          failures.push({ collectionId: item.collectionId, reason: '预订数量必须大于0' });
          failCount++;
          continue;
        }

        await this.ensureCollectionExists(item.collectionId);

        const [newBooking] = await this.db
          .insert(comicUniverseBookings)
          .values({
            collectionId: item.collectionId,
            qqNumber,
            phoneNumber,
            quantity: item.quantity,
            notes: notes || null,
            pickupMethod: pickupMethod || null,
            status: 'pending',
          })
          .returning();

        bookingIds.push(newBooking.id);
        successCount++;
      } catch {
        failures.push({ collectionId: item.collectionId, reason: '创建预订失败' });
        failCount++;
      }
    }

    return {
      bookingIds,
      successCount,
      failCount,
      failures: failures.length > 0 ? failures : undefined,
    };
  }

  async updateBooking(id: number, body: any): Promise<any> {
    await this.ensureBookingExists(id);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.status) {
      updateData.status = body.status;
      switch (body.status) {
        case 'confirmed':
          updateData.confirmedAt = new Date();
          break;
        case 'completed':
          updateData.completedAt = new Date();
          break;
        case 'cancelled':
          updateData.cancelledAt = new Date();
          break;
      }
    }

    if (body.adminNotes !== undefined) {
      updateData.adminNotes = body.adminNotes;
    }

    const [updatedBooking] = await this.db
      .update(comicUniverseBookings)
      .set(updateData)
      .where(eq(comicUniverseBookings.id, id))
      .returning();

    return {
      id: updatedBooking.id,
      collectionId: updatedBooking.collectionId,
      qqNumber: updatedBooking.qqNumber,
      quantity: updatedBooking.quantity,
      status: updatedBooking.status,
      notes: updatedBooking.notes,
      adminNotes: updatedBooking.adminNotes,
      createdAt: updatedBooking.createdAt?.toISOString(),
      updatedAt: updatedBooking.updatedAt?.toISOString(),
      confirmedAt: updatedBooking.confirmedAt?.toISOString(),
      completedAt: updatedBooking.completedAt?.toISOString(),
      cancelledAt: updatedBooking.cancelledAt?.toISOString(),
    };
  }

  async updateBookingStatus(id: number, status: string, adminNotes?: string): Promise<any> {
    if (!status || !['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      throw new BookingCommandError('INVALID_STATUS', '无效的预订状态');
    }

    await this.ensureBookingExists(id);

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    switch (status) {
      case 'confirmed':
        updateData.confirmedAt = new Date();
        break;
      case 'completed':
        updateData.completedAt = new Date();
        break;
      case 'cancelled':
        updateData.cancelledAt = new Date();
        break;
    }

    const updatedBookings = await this.db
      .update(comicUniverseBookings)
      .set(updateData)
      .where(eq(comicUniverseBookings.id, id))
      .returning();

    return updatedBookings[0];
  }

  async deleteBooking(id: number): Promise<void> {
    await this.ensureBookingExists(id);
    await this.db.delete(comicUniverseBookings).where(eq(comicUniverseBookings.id, id));
  }
}

export function createBookingCommandService(db: any): BookingCommandService {
  return new BookingCommandService(db);
}
