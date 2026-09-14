/**
 * vocaloidBooth 路由工厂（Phase H∞）
 * Web Request + Response.json，避免 sa2kit peer next 与宿主 NextRequest 双版本冲突。
 */
import {
  createVocaloidBoothDbService,
  type VocaloidBoothDrizzleDb,
} from '../server';

export type VocaloidBoothRouteConfig = {
  db: VocaloidBoothDrizzleDb;
  resolveFileAccessUrl: (objectKey: string, origin: string) => Promise<string>;
  buildDownloadUrlPath?: (matchCode: string) => string;
};

type BoothFileInput = {
  fileName: string;
  objectKey: string;
  size: number;
  mimeType?: string;
  checksum?: string;
  kind?: string;
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function defaultDownloadUrlPath(matchCode: string) {
  return `/vocaloid-booth?code=${matchCode}`;
}

function createService(config: VocaloidBoothRouteConfig) {
  return createVocaloidBoothDbService(config.db);
}

export function createVocaloidBoothGetHandler() {
  return async () =>
    json({
      success: true,
      message: 'vocaloid booth production route ready',
    });
}

export function createVocaloidBoothPostHandler(config: VocaloidBoothRouteConfig) {
  const service = createService(config);
  const buildDownloadUrlPath = config.buildDownloadUrlPath ?? defaultDownloadUrlPath;

  return async (request: Request) => {
    try {
      const body = await request.json();
      const action = body?.action;

      if (action === 'create') {
        const created = await service.createRecord({
          boothId: body.boothId ?? 'production-booth',
          ttlHours: body.ttlHours ?? 24 * 14,
          metadata: {
            nickname: body.nickname,
            contactTail: body.contactTail,
            note: body.note,
          },
          files: (body.files ?? []).map((file: BoothFileInput) => ({
            fileName: file.fileName,
            objectKey: file.objectKey,
            size: Number(file.size ?? 0),
            mimeType: file.mimeType,
            checksum: file.checksum,
            kind: file.kind ?? 'other',
          })),
        });

        return json({
          success: true,
          data: {
            record: {
              ...created,
              downloadUrlPath: buildDownloadUrlPath(created.matchCode),
            },
          },
        });
      }

      if (action === 'redeem') {
        const record = await service.redeemByCode(body.matchCode);

        if (!record || record.status !== 'active') {
          return json({ success: true, data: record, files: [] });
        }

        const origin = new URL(request.url).origin;
        const files = await Promise.all(
          ((record.files as BoothFileInput[]) ?? []).map(async (file) => {
            try {
              const accessUrl = await config.resolveFileAccessUrl(file.objectKey, origin);
              return {
                ...file,
                accessUrl,
              };
            } catch {
              return {
                ...file,
                accessUrl: '',
              };
            }
          })
        );

        return json({ success: true, data: record, files });
      }

      return json({ success: false, error: 'Unknown action' }, 400);
    } catch (error) {
      return json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  };
}
