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
