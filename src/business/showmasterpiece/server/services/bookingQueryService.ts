import { and, asc, desc, eq, like, sql } from 'drizzle-orm';
import { comicUniverseBookings } from '../schema/bookings';
import { comicUniverseCollections } from '../schema/masterpieces';

export interface AdminBookingQueryInput {
  qqNumber?: string | null;
  phoneNumber?: string | null;
  status?: string | null;
  applyFiltersToStats?: boolean;
}

export interface BookableCollectionsQueryInput {
  categoryId?: number;
  limit?: number;
  orderBy?: 'displayOrder' | 'createdAt' | 'title' | string;
}

export interface BookingListQueryInput {
  collectionId?: number;
  qqNumber?: string;
  phoneNumber?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class BookingQueryService {
  constructor(private readonly db: any) {}

  private buildAdminConditions(input: {
    qqNumber?: string | null;
    phoneNumber?: string | null;
    status?: string | null;
  }): any[] {
    const conditions: any[] = [];

    if (input.qqNumber) {
      conditions.push(like(comicUniverseBookings.qqNumber, `%${input.qqNumber}%`));
    }

    if (input.phoneNumber) {
      conditions.push(like(comicUniverseBookings.phoneNumber, `%${input.phoneNumber}%`));
    }

    if (input.status && input.status !== 'all') {
      conditions.push(eq(comicUniverseBookings.status, input.status));
    }

    return conditions;
  }

  private formatAdminBooking(booking: any): any {
    return {
      id: booking.id,
      collectionId: booking.collectionId,
      qqNumber: booking.qqNumber,
      phoneNumber: booking.phoneNumber,
      quantity: booking.quantity,
      status: booking.status,
      notes: booking.notes,
      pickupMethod: booking.pickupMethod,
      adminNotes: booking.adminNotes,
      createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
      updatedAt: booking.updatedAt instanceof Date ? booking.updatedAt.toISOString() : booking.updatedAt,
      confirmedAt: booking.confirmedAt instanceof Date ? booking.confirmedAt.toISOString() : booking.confirmedAt,
      completedAt: booking.completedAt instanceof Date ? booking.completedAt.toISOString() : booking.completedAt,
      cancelledAt: booking.cancelledAt instanceof Date ? booking.cancelledAt.toISOString() : booking.cancelledAt,
      collection: {
        id: booking.collectionId,
        title: booking.collectionTitle || '未知画集',
        number: booking.collectionNumber || '未知编号',
        coverImage: booking.collectionCoverImage || '',
        price: booking.collectionPrice || 0,
      },
      totalPrice: (booking.collectionPrice || 0) * booking.quantity,
    };
  }

  async getAdminBookings(input: AdminBookingQueryInput = {}): Promise<any> {
    const {
      qqNumber,
      phoneNumber,
      status,
      applyFiltersToStats = true,
    } = input;

    const conditions = this.buildAdminConditions({ qqNumber, phoneNumber, status });

    const bookings = await this.db
      .select({
        id: comicUniverseBookings.id,
        collectionId: comicUniverseBookings.collectionId,
        qqNumber: comicUniverseBookings.qqNumber,
        phoneNumber: comicUniverseBookings.phoneNumber,
        quantity: comicUniverseBookings.quantity,
        status: comicUniverseBookings.status,
        notes: comicUniverseBookings.notes,
        pickupMethod: comicUniverseBookings.pickupMethod,
        adminNotes: comicUniverseBookings.adminNotes,
        createdAt: comicUniverseBookings.createdAt,
        updatedAt: comicUniverseBookings.updatedAt,
        confirmedAt: comicUniverseBookings.confirmedAt,
        completedAt: comicUniverseBookings.completedAt,
        cancelledAt: comicUniverseBookings.cancelledAt,
        collectionTitle: comicUniverseCollections.title,
        collectionNumber: comicUniverseCollections.number,
        collectionCoverImage: comicUniverseCollections.coverImage,
        collectionPrice: comicUniverseCollections.price,
      })
      .from(comicUniverseBookings)
      .leftJoin(comicUniverseCollections, eq(comicUniverseBookings.collectionId, comicUniverseCollections.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(comicUniverseBookings.createdAt));

    const baseStatsQuery = this.db
      .select({
        totalBookings: sql<number>`count(*)`,
        pendingBookings: sql<number>`count(*) filter (where ${comicUniverseBookings.status} = 'pending')`,
        confirmedBookings: sql<number>`count(*) filter (where ${comicUniverseBookings.status} = 'confirmed')`,
        completedBookings: sql<number>`count(*) filter (where ${comicUniverseBookings.status} = 'completed')`,
        cancelledBookings: sql<number>`count(*) filter (where ${comicUniverseBookings.status} = 'cancelled')`,
        totalQuantity: sql<number>`coalesce(sum(${comicUniverseBookings.quantity}), 0)`,
        totalRevenue: sql<number>`coalesce(sum(${comicUniverseBookings.quantity} * coalesce(${comicUniverseCollections.price}, 0)), 0)`,
      })
      .from(comicUniverseBookings)
      .leftJoin(comicUniverseCollections, eq(comicUniverseBookings.collectionId, comicUniverseCollections.id));

    const stats = applyFiltersToStats && conditions.length > 0
      ? await baseStatsQuery.where(and(...conditions))
      : await baseStatsQuery;

    return {
      bookings: bookings.map((booking: any) => this.formatAdminBooking(booking)),
      stats: {
        totalBookings: stats[0]?.totalBookings || 0,
        pendingBookings: stats[0]?.pendingBookings || 0,
        confirmedBookings: stats[0]?.confirmedBookings || 0,
        completedBookings: stats[0]?.completedBookings || 0,
        cancelledBookings: stats[0]?.cancelledBookings || 0,
        totalQuantity: stats[0]?.totalQuantity || 0,
        totalRevenue: stats[0]?.totalRevenue || 0,
      },
    };
  }

  async getBookableCollections(input: BookableCollectionsQueryInput = {}): Promise<any[]> {
    const conditions: any[] = [eq(comicUniverseCollections.isPublished, true)];

    if (input.categoryId) {
      conditions.push(eq(comicUniverseCollections.categoryId, input.categoryId));
    }

    let orderByClause: any;
    switch (input.orderBy) {
      case 'createdAt':
        orderByClause = desc(comicUniverseCollections.createdAt);
        break;
      case 'title':
        orderByClause = asc(comicUniverseCollections.title);
        break;
      case 'displayOrder':
      default:
        orderByClause = asc(comicUniverseCollections.displayOrder);
        break;
    }

    const limit = Math.min(100, Math.max(1, input.limit ?? 50));

    const collections = await this.db
      .select({
        id: comicUniverseCollections.id,
        title: comicUniverseCollections.title,
        number: comicUniverseCollections.number,
        coverImage: comicUniverseCollections.coverImage,
        price: comicUniverseCollections.price,
        description: comicUniverseCollections.description,
        displayOrder: comicUniverseCollections.displayOrder,
        createdAt: comicUniverseCollections.createdAt,
      })
      .from(comicUniverseCollections)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit);

    return collections.map((collection: any) => ({
      id: collection.id,
      title: collection.title,
      number: collection.number,
      coverImage: collection.coverImage,
      price: collection.price,
      description: collection.description,
      displayOrder: collection.displayOrder,
      createdAt: collection.createdAt?.toISOString(),
    }));
  }

  async exportBookingsCsv(): Promise<string> {
    const bookings = await this.db
      .select({
        id: comicUniverseBookings.id,
        qqNumber: comicUniverseBookings.qqNumber,
        phoneNumber: comicUniverseBookings.phoneNumber,
        collectionId: comicUniverseBookings.collectionId,
        status: comicUniverseBookings.status,
        quantity: comicUniverseBookings.quantity,
        notes: comicUniverseBookings.notes,
        pickupMethod: comicUniverseBookings.pickupMethod,
        adminNotes: comicUniverseBookings.adminNotes,
        createdAt: comicUniverseBookings.createdAt,
        updatedAt: comicUniverseBookings.updatedAt,
        confirmedAt: comicUniverseBookings.confirmedAt,
        completedAt: comicUniverseBookings.completedAt,
        cancelledAt: comicUniverseBookings.cancelledAt,
        collectionTitle: comicUniverseCollections.title,
        collectionNumber: comicUniverseCollections.number,
        collectionPrice: comicUniverseCollections.price,
      })
      .from(comicUniverseBookings)
      .leftJoin(comicUniverseCollections, eq(comicUniverseBookings.collectionId, comicUniverseCollections.id))
      .orderBy(comicUniverseBookings.createdAt);

    const headers = [
      '预订ID',
      'QQ号',
      '手机号',
      '画集ID',
      '画集标题',
      '画集编号',
      '画集价格',
      '预订状态',
      '预订数量',
      '用户备注',
      '领取方式',
      '管理员备注',
      '创建时间',
      '更新时间',
      '确认时间',
      '完成时间',
      '取消时间',
    ];

    const statusMap: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消',
    };

    const formatTime = (value: string | Date | null | undefined): string => {
      if (!value) return '';
      return new Date(value).toLocaleString('zh-CN');
    };

    const rows = bookings.map((booking: any) => [
      booking.id,
      booking.qqNumber || '',
      booking.phoneNumber || '',
      booking.collectionId,
      booking.collectionTitle || '',
      booking.collectionNumber || '',
      booking.collectionPrice || '',
      statusMap[booking.status] || booking.status,
      booking.quantity,
      booking.notes || '',
      booking.pickupMethod || '',
      booking.adminNotes || '',
      formatTime(booking.createdAt),
      formatTime(booking.updatedAt),
      formatTime(booking.confirmedAt),
      formatTime(booking.completedAt),
      formatTime(booking.cancelledAt),
    ]);

    const BOM = '\uFEFF';
    return (
      BOM +
      headers.join(',') +
      '\n' +
      rows
        .map((row: any[]) =>
          row
            .map((cell: any) => {
              const cellStr = String(cell || '');
              if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(','),
        )
        .join('\n')
    );
  }

  async getBookingsList(input: BookingListQueryInput = {}): Promise<any> {
    const conditions: any[] = [];

    if (input.collectionId) {
      conditions.push(eq(comicUniverseBookings.collectionId, input.collectionId));
    }

    if (input.qqNumber) {
      conditions.push(like(comicUniverseBookings.qqNumber, `%${input.qqNumber}%`));
    }

    if (input.phoneNumber) {
      conditions.push(like(comicUniverseBookings.phoneNumber, `%${input.phoneNumber}%`));
    }

    if (input.status) {
      conditions.push(eq(comicUniverseBookings.status, input.status));
    }

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 20));
    const offset = (page - 1) * limit;

    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(comicUniverseBookings)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult[0]?.count || 0;

    const bookings = await this.db
      .select({
        id: comicUniverseBookings.id,
        collectionId: comicUniverseBookings.collectionId,
        qqNumber: comicUniverseBookings.qqNumber,
        phoneNumber: comicUniverseBookings.phoneNumber,
        quantity: comicUniverseBookings.quantity,
        status: comicUniverseBookings.status,
        notes: comicUniverseBookings.notes,
        adminNotes: comicUniverseBookings.adminNotes,
        createdAt: comicUniverseBookings.createdAt,
        updatedAt: comicUniverseBookings.updatedAt,
        confirmedAt: comicUniverseBookings.confirmedAt,
        completedAt: comicUniverseBookings.completedAt,
        cancelledAt: comicUniverseBookings.cancelledAt,
        collectionTitle: comicUniverseCollections.title,
        collectionNumber: comicUniverseCollections.number,
        collectionCoverImage: comicUniverseCollections.coverImage,
        collectionPrice: comicUniverseCollections.price,
      })
      .from(comicUniverseBookings)
      .leftJoin(comicUniverseCollections, eq(comicUniverseBookings.collectionId, comicUniverseCollections.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(comicUniverseBookings.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      bookings: bookings.map((booking: any) => ({
        id: booking.id,
        collectionId: booking.collectionId,
        qqNumber: booking.qqNumber,
        phoneNumber: booking.phoneNumber,
        quantity: booking.quantity,
        status: booking.status,
        notes: booking.notes,
        adminNotes: booking.adminNotes,
        createdAt: booking.createdAt?.toISOString(),
        updatedAt: booking.updatedAt?.toISOString(),
        confirmedAt: booking.confirmedAt?.toISOString(),
        completedAt: booking.completedAt?.toISOString(),
        cancelledAt: booking.cancelledAt?.toISOString(),
        collection: {
          id: booking.collectionId,
          title: booking.collectionTitle,
          number: booking.collectionNumber,
          coverImage: booking.collectionCoverImage,
          price: booking.collectionPrice,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBookingById(id: number): Promise<any | null> {
    const bookings = await this.db
      .select({
        id: comicUniverseBookings.id,
        collectionId: comicUniverseBookings.collectionId,
        qqNumber: comicUniverseBookings.qqNumber,
        phoneNumber: comicUniverseBookings.phoneNumber,
        quantity: comicUniverseBookings.quantity,
        status: comicUniverseBookings.status,
        notes: comicUniverseBookings.notes,
        adminNotes: comicUniverseBookings.adminNotes,
        createdAt: comicUniverseBookings.createdAt,
        updatedAt: comicUniverseBookings.updatedAt,
        confirmedAt: comicUniverseBookings.confirmedAt,
        completedAt: comicUniverseBookings.completedAt,
        cancelledAt: comicUniverseBookings.cancelledAt,
        collectionTitle: comicUniverseCollections.title,
        collectionNumber: comicUniverseCollections.number,
        collectionCoverImage: comicUniverseCollections.coverImage,
        collectionPrice: comicUniverseCollections.price,
        collectionDescription: comicUniverseCollections.description,
      })
      .from(comicUniverseBookings)
      .leftJoin(comicUniverseCollections, eq(comicUniverseBookings.collectionId, comicUniverseCollections.id))
      .where(eq(comicUniverseBookings.id, id))
      .limit(1);

    if (bookings.length === 0) {
      return null;
    }

    const booking = bookings[0];
    return {
      id: booking.id,
      collectionId: booking.collectionId,
      qqNumber: booking.qqNumber,
      phoneNumber: booking.phoneNumber,
      quantity: booking.quantity,
      status: booking.status,
      notes: booking.notes,
      adminNotes: booking.adminNotes,
      createdAt: booking.createdAt?.toISOString(),
      updatedAt: booking.updatedAt?.toISOString(),
      confirmedAt: booking.confirmedAt?.toISOString(),
      completedAt: booking.completedAt?.toISOString(),
      cancelledAt: booking.cancelledAt?.toISOString(),
      collection: {
        id: booking.collectionId,
        title: booking.collectionTitle,
        number: booking.collectionNumber,
        coverImage: booking.collectionCoverImage,
        price: booking.collectionPrice,
        description: booking.collectionDescription,
      },
    };
  }
}

export function createBookingQueryService(db: any): BookingQueryService {
  return new BookingQueryService(db);
}
