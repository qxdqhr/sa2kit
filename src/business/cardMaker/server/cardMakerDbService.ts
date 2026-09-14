import { eq, and, desc } from 'drizzle-orm';
import { cards, cardAssets, type Card, type NewCard, type CardAsset, type NewCardAsset } from './schema';

export type CardMakerDrizzleDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
};

export class CardMakerDbService {
  constructor(private readonly db: CardMakerDrizzleDb) {}

  async createCard(cardData: NewCard): Promise<Card> {
    const [newCard] = await this.db
      .insert(cards)
      .values({
        ...cardData,
        updatedAt: new Date(),
      })
      .returning();
    return newCard;
  }

  async getCardById(id: string): Promise<Card | null> {
    const [card] = await this.db.select().from(cards).where(eq(cards.id, id));
    return card || null;
  }

  async getCardsByUserId(userId: string): Promise<Card[]> {
    return this.db
      .select()
      .from(cards)
      .where(eq(cards.userId, userId))
      .orderBy(desc(cards.updatedAt));
  }

  async getAllCards(): Promise<Card[]> {
    return this.db.select().from(cards).orderBy(desc(cards.updatedAt));
  }

  async updateCard(id: string, updates: Partial<NewCard>): Promise<Card | null> {
    const [updatedCard] = await this.db
      .update(cards)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, id))
      .returning();
    return updatedCard || null;
  }

  async deleteCard(id: string): Promise<boolean> {
    const result = await this.db.delete(cards).where(eq(cards.id, id));
    return result.length > 0;
  }

  async createAsset(assetData: NewCardAsset): Promise<CardAsset> {
    const [newAsset] = await this.db.insert(cardAssets).values(assetData).returning();
    return newAsset;
  }

  async getAssetById(id: string): Promise<CardAsset | null> {
    const [asset] = await this.db.select().from(cardAssets).where(eq(cardAssets.id, id));
    return asset || null;
  }

  async getAssetsByType(type: string): Promise<CardAsset[]> {
    return this.db
      .select()
      .from(cardAssets)
      .where(eq(cardAssets.type, type))
      .orderBy(desc(cardAssets.createdAt));
  }

  async getAssetsByCategory(category: string): Promise<CardAsset[]> {
    return this.db
      .select()
      .from(cardAssets)
      .where(eq(cardAssets.category, category))
      .orderBy(desc(cardAssets.createdAt));
  }

  async getAssetsByTypeAndCategory(type: string, category: string): Promise<CardAsset[]> {
    return this.db
      .select()
      .from(cardAssets)
      .where(and(eq(cardAssets.type, type), eq(cardAssets.category, category)))
      .orderBy(desc(cardAssets.createdAt));
  }

  async getAllAssets(): Promise<CardAsset[]> {
    return this.db.select().from(cardAssets).orderBy(desc(cardAssets.createdAt));
  }

  async deleteAsset(id: string): Promise<boolean> {
    const result = await this.db.delete(cardAssets).where(eq(cardAssets.id, id));
    return result.length > 0;
  }

  async getDistinctCategories(): Promise<string[]> {
    const result = await this.db
      .selectDistinct({
        category: cardAssets.category,
      })
      .from(cardAssets);
    return result.map((row: { category: string }) => row.category);
  }

  async getDistinctTypes(): Promise<string[]> {
    const result = await this.db
      .selectDistinct({
        type: cardAssets.type,
      })
      .from(cardAssets);
    return result.map((row: { type: string }) => row.type);
  }
}

export function createCardMakerDbService(db: CardMakerDrizzleDb) {
  return new CardMakerDbService(db);
}
