/**
 * cardMaker 路由工厂（Phase H2）
 * Web Request + Response.json，避免 sa2kit peer next 与宿主 NextRequest 双版本冲突。
 */
import {
  createCardMakerDbService,
  type CardMakerDrizzleDb,
} from '../server';

export type CardMakerSessionUser = { id: string };

export type CardMakerUploadResult = { fileUrl: string };

export type CardMakerUploadAsset = (input: {
  file: File;
  type: string;
  category: string;
}) => Promise<CardMakerUploadResult>;

export type CardMakerRouteConfig = {
  db: CardMakerDrizzleDb;
  getSessionUser: (request: Request) => Promise<CardMakerSessionUser | null>;
  uploadAssetFile: CardMakerUploadAsset;
};

type IdRouteContext = { params: Promise<{ id: string }> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function unauthorized(message = '未授权的访问') {
  return json({ error: message }, 401);
}

function forbidden(message: string) {
  return json({ error: message }, 403);
}

function createService(config: CardMakerRouteConfig) {
  return createCardMakerDbService(config.db);
}

async function requireUser(config: CardMakerRouteConfig, request: Request) {
  const user = await config.getSessionUser(request);
  if (!user) return { user: null as null, response: unauthorized() };
  return { user, response: null as null };
}

async function requireOwnedCard(config: CardMakerRouteConfig, request: Request, id: string) {
  const service = createService(config);
  const { user, response } = await requireUser(config, request);
  if (response) return { error: response };

  const card = await service.getCardById(id);
  if (!card) return { error: json({ error: 'Card not found' }, 404) };

  if (card.userId && card.userId !== String(user!.id)) {
    return { error: forbidden('无权操作该名片') };
  }

  return { user: user!, card };
}

export function createListCardsHandler(config: CardMakerRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    try {
      const { user, response } = await requireUser(config, request);
      if (response) return response;

      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const effectiveUserId = userId || String(user!.id);

      if (effectiveUserId !== String(user!.id)) {
        return forbidden('无权查看其他用户的名片');
      }

      const cards = await service.getCardsByUserId(effectiveUserId);
      return json(cards);
    } catch (error) {
      console.error('[cardMaker] list cards failed:', error);
      return json({ error: 'Failed to fetch cards' }, 500);
    }
  };
}

export function createCreateCardHandler(config: CardMakerRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    try {
      const { user, response } = await requireUser(config, request);
      if (response) return response;

      const cardData = (await request.json()) as Record<string, unknown>;
      if (!cardData.characterName) {
        return json({ error: 'Character name is required' }, 400);
      }

      const newCard = await service.createCard({
        ...cardData,
        userId: String(user!.id),
      } as Parameters<typeof service.createCard>[0]);
      return json(newCard, 201);
    } catch (error) {
      console.error('[cardMaker] create card failed:', error);
      return json({ error: 'Failed to create card' }, 500);
    }
  };
}

export function createGetCardHandler(config: CardMakerRouteConfig) {
  return async (request: Request, context: IdRouteContext) => {
    try {
      const { id } = await context.params;
      const owned = await requireOwnedCard(config, request, id);
      if (owned.error) return owned.error;
      return json(owned.card);
    } catch (error) {
      console.error('[cardMaker] get card failed:', error);
      return json({ error: 'Failed to fetch card' }, 500);
    }
  };
}

export function createUpdateCardHandler(config: CardMakerRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    try {
      const { id } = await context.params;
      const owned = await requireOwnedCard(config, request, id);
      if (owned.error) return owned.error;

      const updates = (await request.json()) as Record<string, unknown>;
      delete updates.userId;
      delete updates.id;

      const updatedCard = await service.updateCard(id, updates);
      if (!updatedCard) return json({ error: 'Card not found' }, 404);
      return json(updatedCard);
    } catch (error) {
      console.error('[cardMaker] update card failed:', error);
      return json({ error: 'Failed to update card' }, 500);
    }
  };
}

export function createDeleteCardHandler(config: CardMakerRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    try {
      const { id } = await context.params;
      const owned = await requireOwnedCard(config, request, id);
      if (owned.error) return owned.error;

      const success = await service.deleteCard(id);
      if (!success) return json({ error: 'Card not found' }, 404);
      return json({ message: 'Card deleted successfully' });
    } catch (error) {
      console.error('[cardMaker] delete card failed:', error);
      return json({ error: 'Failed to delete card' }, 500);
    }
  };
}

export function createListAssetsHandler(config: CardMakerRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type');
      const category = searchParams.get('category');

      let assets;
      if (type && category) {
        assets = await service.getAssetsByTypeAndCategory(type, category);
      } else if (type) {
        assets = await service.getAssetsByType(type);
      } else if (category) {
        assets = await service.getAssetsByCategory(category);
      } else {
        assets = await service.getAllAssets();
      }

      const formattedAssets = assets.map((asset) => ({
        ...asset,
        tags: asset.tags ? JSON.parse(asset.tags) : [],
      }));

      return json(formattedAssets);
    } catch (error) {
      console.error('[cardMaker] list assets failed:', error);
      return json({ error: 'Failed to fetch assets' }, 500);
    }
  };
}

export function createListAssetCategoriesHandler(config: CardMakerRouteConfig) {
  const service = createService(config);
  return async () => {
    try {
      const categories = await service.getDistinctCategories();
      return json(categories);
    } catch (error) {
      console.error('[cardMaker] list categories failed:', error);
      return json({ error: 'Failed to fetch categories' }, 500);
    }
  };
}

export function createUploadAssetHandler(config: CardMakerRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    try {
      const { response } = await requireUser(config, request);
      if (response) return response;

      const formData = await request.formData();
      const file = formData.get('file');
      const type = formData.get('type');
      const category = formData.get('category');
      const name = formData.get('name');

      if (!(file instanceof File) || typeof type !== 'string' || typeof category !== 'string' || typeof name !== 'string') {
        return json({ error: 'Missing required fields' }, 400);
      }

      if (!file.type.startsWith('image/')) {
        return json({ error: 'Only image files are allowed' }, 400);
      }

      const { fileUrl } = await config.uploadAssetFile({ file, type, category });

      const asset = await service.createAsset({
        type,
        category,
        fileUrl,
        name,
        tags: JSON.stringify([]),
      });

      return json(
        {
          ...asset,
          tags: [],
        },
        201,
      );
    } catch (error) {
      console.error('[cardMaker] upload asset failed:', error);
      return json({ error: 'Failed to upload asset' }, 500);
    }
  };
}
