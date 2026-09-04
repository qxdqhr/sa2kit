import {
  bookingMatchesLookup,
  validatePublicBookingLookup,
  type BookingListParams,
} from '../domain';
import {
  BookingCommandError,
  createBookingCommandService,
  createBookingQueryService,
  deleteBookingWithCredentialGuard,
  isBookingDeleteUnauthorized,
  type BookingDeleteCredentials,
} from '../server';

export type ShowmasterpieceSessionUser = {
  id: string;
  role?: string | null;
};

/** Web Request，避免 sa2kit peer next 与宿主 NextRequest 双版本冲突 */
export type BookingRouteConfig = {
  db: unknown;
  getSessionUser: (request: Request) => Promise<ShowmasterpieceSessionUser | null>;
  isAdminUser: (user: ShowmasterpieceSessionUser | null) => boolean;
  /** 管理端 POST 强制刷新 DB（宿主注入，如 @profile/db） */
  forceRefreshDatabase?: () => Promise<void>;
  getDatabaseConnectionStatus?: () => Promise<unknown>;
};

type IdRouteContext = { params: Promise<{ id: string }> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function apiError(message: string, status: number) {
  return json({ error: message }, status);
}

export function parseBookingCredentialsFromQuery(
  request: Request,
): BookingDeleteCredentials | null {
  const { searchParams } = new URL(request.url);
  const qqNumber = searchParams.get('qqNumber')?.trim() ?? '';
  const phoneNumber = searchParams.get('phoneNumber')?.trim() ?? '';
  if (qqNumber && phoneNumber) {
    return { qqNumber, phoneNumber };
  }
  return null;
}

/** query 优先；否则尝试 JSON body（用于 DELETE 等） */
export async function parseBookingCredentials(
  request: Request,
): Promise<BookingDeleteCredentials | null> {
  const fromQuery = parseBookingCredentialsFromQuery(request);
  if (fromQuery) return fromQuery;

  try {
    const body = await request.json();
    if (body && typeof body === 'object') {
      const qqNumber = String((body as { qqNumber?: unknown }).qqNumber ?? '').trim();
      const phoneNumber = String(
        (body as { phoneNumber?: unknown }).phoneNumber ?? '',
      ).trim();
      if (qqNumber && phoneNumber) {
        return { qqNumber, phoneNumber };
      }
    }
  } catch {
    // 无 body
  }

  return null;
}

function parseListParams(request: Request): BookingListParams {
  const { searchParams } = new URL(request.url);
  return {
    collectionId: searchParams.get('collectionId')
      ? parseInt(searchParams.get('collectionId')!, 10)
      : undefined,
    qqNumber: searchParams.get('qqNumber') || undefined,
    phoneNumber: searchParams.get('phoneNumber') || undefined,
    status: (searchParams.get('status') as BookingListParams['status']) || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
    pageSize: searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : searchParams.get('pageSize')
        ? parseInt(searchParams.get('pageSize')!, 10)
        : 20,
  };
}

/** 兼容 core 的 limit 字段名 */
function toQueryInput(params: BookingListParams) {
  return {
    collectionId: params.collectionId,
    qqNumber: params.qqNumber,
    phoneNumber: params.phoneNumber,
    status: params.status,
    page: params.page,
    limit: params.pageSize ?? 20,
  };
}

export function createListBookingsHandler(config: BookingRouteConfig) {
  const query = createBookingQueryService(config.db);
  return async (request: Request) => {
    try {
      const params = parseListParams(request);
      const user = await config.getSessionUser(request);

      if (!config.isAdminUser(user)) {
        const lookupError = validatePublicBookingLookup(params);
        if (lookupError) {
          return apiError(lookupError, 400);
        }
      }

      const result = await query.getBookingsList(toQueryInput(params));
      return json(result);
    } catch (error) {
      console.error('获取预订列表失败:', error);
      return apiError('获取预订列表失败', 500);
    }
  };
}

export function createGetBookingHandler(config: BookingRouteConfig) {
  const query = createBookingQueryService(config.db);
  return async (request: Request, context: IdRouteContext) => {
    try {
      const { id: idStr } = await context.params;
      const id = parseInt(idStr, 10);
      if (Number.isNaN(id)) {
        return apiError('无效的预订ID', 400);
      }

      const booking = await query.getBookingById(id);
      if (!booking) {
        return apiError('预订不存在', 404);
      }

      const user = await config.getSessionUser(request);
      if (config.isAdminUser(user)) {
        return json(booking);
      }

      const credentials = parseBookingCredentialsFromQuery(request);
      if (
        !credentials ||
        !bookingMatchesLookup(booking, credentials.qqNumber, credentials.phoneNumber)
      ) {
        return apiError('未授权的访问', 401);
      }

      const { adminNotes: _adminNotes, ...publicBooking } = booking as Record<
        string,
        unknown
      >;
      return json(publicBooking);
    } catch (error) {
      console.error('获取预订详情失败:', error);
      return apiError('获取预订详情失败', 500);
    }
  };
}

export function createDeleteBookingHandler(config: BookingRouteConfig) {
  return async (request: Request, context: IdRouteContext) => {
    try {
      const { id: idStr } = await context.params;
      const id = parseInt(idStr, 10);
      if (Number.isNaN(id)) {
        return apiError('无效的预订ID', 400);
      }

      const user = await config.getSessionUser(request);
      const isAdmin = config.isAdminUser(user);
      const credentials = isAdmin ? null : await parseBookingCredentials(request);

      if (!isAdmin && !credentials) {
        return apiError('删除预订请同时提供匹配的 QQ 号与手机号', 401);
      }

      await deleteBookingWithCredentialGuard(config.db, id, { isAdmin, credentials });

      return json({ data: { message: '预订删除成功', bookingId: id } });
    } catch (error) {
      if (error instanceof BookingCommandError) {
        if (isBookingDeleteUnauthorized(error)) {
          return apiError(error.message, 401);
        }
        const status = error.code === 'BOOKING_NOT_FOUND' ? 404 : 400;
        return json({ error: error.message }, status);
      }
      console.error('删除预订失败:', error);
      return apiError('删除预订失败', 500);
    }
  };
}

/** 管理端更新预订（需 isAdminUser） */
export function createUpdateBookingHandler(config: BookingRouteConfig) {
  const command = createBookingCommandService(config.db);
  return async (request: Request, context: IdRouteContext) => {
    try {
      const user = await config.getSessionUser(request);
      if (!config.isAdminUser(user)) {
        return apiError('需要管理员权限', 403);
      }

      const { id: idStr } = await context.params;
      const id = parseInt(idStr, 10);
      if (Number.isNaN(id)) {
        return apiError('无效的预订ID', 400);
      }

      const body = await request.json();
      const updatedBooking = await command.updateBooking(id, body);
      return json(updatedBooking);
    } catch (error) {
      if (error instanceof BookingCommandError) {
        const status = error.code === 'BOOKING_NOT_FOUND' ? 404 : 400;
        return json({ error: error.message }, status);
      }
      console.error('更新预订失败:', error);
      return apiError('更新预订失败', 500);
    }
  };
}

/** 创建预订（限流由宿主包装） */
export function createCreateBookingHandler(config: BookingRouteConfig) {
  const command = createBookingCommandService(config.db);
  return async (request: Request) => {
    try {
      const body = await request.json();
      const result = await command.createBooking(body);
      return json(result, 201);
    } catch (error) {
      if (error instanceof BookingCommandError) {
        const status = error.code === 'COLLECTION_NOT_FOUND' ? 404 : 400;
        return json({ error: error.message }, status);
      }
      console.error('创建预订失败:', error);
      return apiError('创建预订失败', 500);
    }
  };
}

async function requireAdminOrFail(
  config: BookingRouteConfig,
  request: Request,
): Promise<ShowmasterpieceSessionUser | Response> {
  const user = await config.getSessionUser(request);
  if (!user) {
    return apiError('未授权的访问', 401);
  }
  if (!config.isAdminUser(user)) {
    return apiError('需要管理员权限', 403);
  }
  return user;
}

function parseAdminSearchParams(request: Request) {
  let searchParams = new URLSearchParams();
  try {
    searchParams = new URL(request.url).searchParams;
  } catch {
    // ignore
  }
  const qqNumber = searchParams.get('qqNumber');
  const phoneNumber = searchParams.get('phoneNumber');
  const statusParam = searchParams.get('status');
  const status =
    statusParam && statusParam !== 'all' ? statusParam : null;
  return { qqNumber, phoneNumber, status };
}

function withNoCache(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** 管理端列表 + 统计 */
export function createListAdminBookingsHandler(config: BookingRouteConfig) {
  const query = createBookingQueryService(config.db);
  return async (request: Request) => {
    const auth = await requireAdminOrFail(config, request);
    if (auth instanceof Response) return auth;

    try {
      const { qqNumber, phoneNumber, status } = parseAdminSearchParams(request);
      const result = await query.getAdminBookings({
        qqNumber,
        phoneNumber,
        status,
        applyFiltersToStats: true,
      });
      return withNoCache(
        json({
          bookings: result.bookings,
          stats: result.stats,
          _timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.error('获取预订管理数据失败:', error);
      return apiError('获取预订管理数据失败', 500);
    }
  };
}

/** 管理端强制刷新 DB 后查询（副作用；刷新实现由宿主注入） */
export function createAdminRefreshBookingsHandler(config: BookingRouteConfig) {
  const query = createBookingQueryService(config.db);
  return async (request: Request) => {
    const auth = await requireAdminOrFail(config, request);
    if (auth instanceof Response) return auth;

    try {
      const { qqNumber, phoneNumber, status } = parseAdminSearchParams(request);
      if (config.getDatabaseConnectionStatus) {
        await config.getDatabaseConnectionStatus();
      }
      if (config.forceRefreshDatabase) {
        await config.forceRefreshDatabase();
      }

      const result = await query.getAdminBookings({
        qqNumber,
        phoneNumber,
        status,
        applyFiltersToStats: false,
      });

      return new Response(
        JSON.stringify({
          bookings: result.bookings,
          stats: result.stats,
          _timestamp: Date.now(),
          _refreshType: 'FORCE_REFRESH',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control':
              'no-cache, no-store, must-revalidate, max-age=0, private',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
      );
    } catch (error) {
      console.error('强制刷新预订数据失败:', error);
      return apiError('强制刷新预订数据失败', 500);
    }
  };
}

/** 管理端删单 */
export function createAdminDeleteBookingHandler(config: BookingRouteConfig) {
  const command = createBookingCommandService(config.db);
  return async (_request: Request, context: IdRouteContext) => {
    const auth = await requireAdminOrFail(config, _request);
    if (auth instanceof Response) return auth;

    try {
      const { id: idStr } = await context.params;
      const id = parseInt(idStr, 10);
      if (Number.isNaN(id)) {
        return apiError('无效的预订ID', 400);
      }

      await command.deleteBooking(id, { asAdmin: true });
      return json({ data: { message: '预订删除成功', bookingId: id } });
    } catch (error) {
      if (error instanceof BookingCommandError) {
        const status = error.code === 'BOOKING_NOT_FOUND' ? 404 : 400;
        return json({ error: error.message }, status);
      }
      console.error('删除预订失败:', error);
      return apiError('删除预订失败', 500);
    }
  };
}

/** 管理端更新状态 */
export function createAdminUpdateBookingStatusHandler(config: BookingRouteConfig) {
  const command = createBookingCommandService(config.db);
  return async (request: Request, context: IdRouteContext) => {
    const auth = await requireAdminOrFail(config, request);
    if (auth instanceof Response) return auth;

    try {
      const { id: idStr } = await context.params;
      const bookingId = parseInt(idStr, 10);
      if (Number.isNaN(bookingId)) {
        return apiError('无效的预订ID', 400);
      }

      const body = (await request.json()) as {
        status?: string;
        adminNotes?: string;
      };
      const updatedBooking = await command.updateBookingStatus(
        bookingId,
        String(body.status ?? ''),
        body.adminNotes,
      );

      return json({
        id: updatedBooking.id,
        collectionId: updatedBooking.collectionId,
        qqNumber: updatedBooking.qqNumber,
        phoneNumber: updatedBooking.phoneNumber,
        quantity: updatedBooking.quantity,
        status: updatedBooking.status,
        notes: updatedBooking.notes,
        adminNotes: updatedBooking.adminNotes,
        createdAt:
          updatedBooking.createdAt?.toISOString?.() ?? updatedBooking.createdAt,
        updatedAt:
          updatedBooking.updatedAt?.toISOString?.() ?? updatedBooking.updatedAt,
        confirmedAt:
          updatedBooking.confirmedAt?.toISOString?.() ?? updatedBooking.confirmedAt,
        completedAt:
          updatedBooking.completedAt?.toISOString?.() ?? updatedBooking.completedAt,
        cancelledAt:
          updatedBooking.cancelledAt?.toISOString?.() ?? updatedBooking.cancelledAt,
      });
    } catch (error) {
      if (error instanceof BookingCommandError) {
        const statusCode = error.code === 'BOOKING_NOT_FOUND' ? 404 : 400;
        return json({ error: error.message }, statusCode);
      }
      console.error('更新预订状态失败:', error);
      return apiError('更新预订状态失败', 500);
    }
  };
}

/** 管理端导出 CSV */
export function createExportBookingsCsvHandler(config: BookingRouteConfig) {
  const query = createBookingQueryService(config.db);
  return async (request: Request) => {
    const auth = await requireAdminOrFail(config, request);
    if (auth instanceof Response) return auth;

    try {
      const { searchParams } = new URL(request.url);
      const format = searchParams.get('format') || 'csv';
      if (format !== 'csv') {
        return apiError('目前只支持CSV格式导出', 400);
      }

      const csvContent = await query.exportBookingsCsv();
      const fileName = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } catch (error) {
      console.error('导出预订数据失败:', error);
      return apiError('导出预订数据失败', 500);
    }
  };
}

/** 可预订画集列表（公开） */
export function createListBookableCollectionsHandler(config: BookingRouteConfig) {
  const query = createBookingQueryService(config.db);
  return async (request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const categoryId = searchParams.get('categoryId')
        ? parseInt(searchParams.get('categoryId')!, 10)
        : undefined;
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!, 10)
        : 50;
      const orderBy = searchParams.get('orderBy') || 'displayOrder';

      const collections = await query.getBookableCollections({
        categoryId,
        limit,
        orderBy,
      });
      return json(collections);
    } catch (error) {
      console.error('获取可预订画集列表失败:', error);
      return apiError('获取画集列表失败', 500);
    }
  };
}

const MAX_BATCH_ITEMS = 50;

/** 批量预订（限流由宿主包装） */
export function createBatchCreateBookingsHandler(config: BookingRouteConfig) {
  const command = createBookingCommandService(config.db);
  return async (request: Request) => {
    try {
      const body = (await request.json()) as {
        qqNumber?: string;
        phoneNumber?: string;
        items?: unknown[];
      };
      const qqNumber = String(body?.qqNumber ?? '').trim();
      const phoneNumber = String(body?.phoneNumber ?? '').trim();
      const items = body?.items;

      if (!qqNumber || !phoneNumber || !Array.isArray(items) || items.length === 0) {
        return apiError('缺少必要参数：QQ 号、手机号、预订项列表', 400);
      }
      if (items.length > MAX_BATCH_ITEMS) {
        return apiError(`单次批量预订最多 ${MAX_BATCH_ITEMS} 项`, 400);
      }

      const result = await command.batchCreateBookings(body);
      return json(result, 201);
    } catch (error) {
      if (error instanceof BookingCommandError) {
        return json({ error: error.message }, 400);
      }
      console.error('批量预订失败:', error);
      return apiError('批量预订失败', 500);
    }
  };
}
