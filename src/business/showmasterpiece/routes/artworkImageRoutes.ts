/**
 * showmasterpiece — artwork image GET/HEAD route factories（SMP1）
 */
import { and, eq } from 'drizzle-orm';
import { comicUniverseArtworks } from '../server';
import type { ShowmasterpieceFileUrlResolver } from '../server';

export type ArtworkImageRouteConfig = {
  db: any;
  /** 宿主注入：fileId → OSS/API URL */
  resolveFileUrl: ShowmasterpieceFileUrlResolver;
};

type ArtworkImageContext = {
  params: Promise<{ id: string; artworkId: string }>;
};

function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function requestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

function decodeDataUrl(imageData: string): {
  contentType: string;
  body: Uint8Array;
} | null {
  if (!imageData.startsWith('data:')) return null;
  const comma = imageData.indexOf(',');
  if (comma < 0) return null;
  const meta = imageData.slice(0, comma);
  const base64Data = imageData.slice(comma + 1);
  const contentType = meta.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const binary = atob(base64Data);
  const body = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    body[i] = binary.charCodeAt(i);
  }
  return { contentType, body };
}

async function loadArtworkImageRow(
  db: any,
  collectionId: number,
  artworkId: number,
) {
  const result = await db
    .select({
      fileId: comicUniverseArtworks.fileId,
      image: comicUniverseArtworks.image,
      updatedAt: comicUniverseArtworks.updatedAt,
    })
    .from(comicUniverseArtworks)
    .where(
      and(
        eq(comicUniverseArtworks.id, artworkId),
        eq(comicUniverseArtworks.collectionId, collectionId),
        eq(comicUniverseArtworks.isActive, true),
      ),
    )
    .limit(1);
  return result[0] ?? null;
}

async function resolveArtworkFileUrl(
  resolveFileUrl: ShowmasterpieceFileUrlResolver,
  fileId: string,
): Promise<string | null> {
  try {
    const url = await resolveFileUrl(fileId);
    return url ?? null;
  } catch (error) {
    console.error('通过 fileId 获取图片失败:', error);
    return null;
  }
}

export function createGetArtworkImageHandler(config: ArtworkImageRouteConfig) {
  return async (request: Request, context: ArtworkImageContext) => {
    try {
      const { id, artworkId: artworkIdParam } = await context.params;
      const collectionId = parseInt(id, 10);
      const artworkId = parseInt(artworkIdParam, 10);

      if (Number.isNaN(collectionId) || Number.isNaN(artworkId)) {
        return apiError('无效的参数', 400);
      }

      const artwork = await loadArtworkImageRow(
        config.db,
        collectionId,
        artworkId,
      );
      if (!artwork) {
        return apiError('图片不存在', 404);
      }

      const ifNoneMatch = request.headers.get('if-none-match');
      const etag = `"${artworkId}-${artwork.updatedAt?.getTime() || 0}"`;

      if (ifNoneMatch === etag) {
        return new Response(null, { status: 304 });
      }

      if (artwork.fileId) {
        const imageUrl = await resolveArtworkFileUrl(
          config.resolveFileUrl,
          artwork.fileId,
        );
        if (imageUrl) {
          if (
            imageUrl.startsWith('http://') ||
            imageUrl.startsWith('https://')
          ) {
            return Response.redirect(imageUrl, 302);
          }
          return Response.redirect(
            `${requestOrigin(request)}${imageUrl}`,
            302,
          );
        }
      }

      const imageData = artwork.image;
      if (!imageData) {
        return apiError('图片数据不存在', 404);
      }

      const decoded = decodeDataUrl(imageData);
      if (decoded) {
        return new Response(decoded.body, {
          status: 200,
          headers: {
            'Content-Type': decoded.contentType,
            'Content-Length': String(decoded.body.byteLength),
            'Cache-Control':
              'public, max-age=3600, stale-while-revalidate=86400',
            ETag: etag,
            'Last-Modified':
              artwork.updatedAt?.toUTCString() || new Date().toUTCString(),
          },
        });
      }

      return Response.redirect(imageData, 302);
    } catch (error) {
      console.error('获取图片失败:', error);
      return apiError('获取图片失败', 500);
    }
  };
}

export function createHeadArtworkImageHandler(config: ArtworkImageRouteConfig) {
  return async (_request: Request, context: ArtworkImageContext) => {
    try {
      const { id, artworkId: artworkIdParam } = await context.params;
      const collectionId = parseInt(id, 10);
      const artworkId = parseInt(artworkIdParam, 10);

      if (Number.isNaN(collectionId) || Number.isNaN(artworkId)) {
        return new Response(null, { status: 400 });
      }

      const result = await config.db
        .select({
          id: comicUniverseArtworks.id,
          updatedAt: comicUniverseArtworks.updatedAt,
        })
        .from(comicUniverseArtworks)
        .where(
          and(
            eq(comicUniverseArtworks.id, artworkId),
            eq(comicUniverseArtworks.collectionId, collectionId),
            eq(comicUniverseArtworks.isActive, true),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return new Response(null, { status: 404 });
      }

      const artwork = result[0];
      const etag = `"${artworkId}-${artwork.updatedAt?.getTime() || 0}"`;

      return new Response(null, {
        status: 200,
        headers: {
          'Cache-Control':
            'public, max-age=3600, stale-while-revalidate=86400',
          ETag: etag,
          'Last-Modified':
            artwork.updatedAt?.toUTCString() || new Date().toUTCString(),
        },
      });
    } catch (error) {
      console.error('检查图片失败:', error);
      return new Response(null, { status: 500 });
    }
  };
}
