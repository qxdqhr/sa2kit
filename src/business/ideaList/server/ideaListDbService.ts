import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { ideaLists, ideaItems } from './schema';
import type {
  IdeaList,
  IdeaItem,
  NewIdeaList,
  NewIdeaItem,
  IdeaListWithItems,
  ConvertToListInput,
} from '../domain/types';

export type IdeaListDrizzleDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
  transaction: <T>(fn: (tx: any) => Promise<T>) => Promise<T>;
};

/**
 * 想法清单数据库服务
 */
export class IdeaListDbService {
  constructor(private readonly db: IdeaListDrizzleDb) {}

  // ===== 想法清单操作 =====
  
  /**
   * 获取用户的所有想法清单（包含统计信息）
   */
  async getUserIdeaLists(userId: string): Promise<IdeaListWithItems[]> {
    const lists = await this.db
      .select({
        id: ideaLists.id,
        userId: ideaLists.userId,
        name: ideaLists.name,
        description: ideaLists.description,
        color: ideaLists.color,
        order: ideaLists.order,
        createdAt: ideaLists.createdAt,
        updatedAt: ideaLists.updatedAt,
        itemCount: sql<number>`cast(count(${ideaItems.id}) as int)`,
        completedCount: sql<number>`cast(count(case when ${ideaItems.isCompleted} = true then 1 end) as int)`,
      })
      .from(ideaLists)
      .leftJoin(ideaItems, eq(ideaLists.id, ideaItems.listId))
      .where(eq(ideaLists.userId, userId))
      .groupBy(ideaLists.id)
      .orderBy(asc(ideaLists.order), desc(ideaLists.createdAt));

    // 获取每个清单的项目
    const listsWithItems: IdeaListWithItems[] = [];
    for (const list of lists) {
      const items = await this.getIdeaItemsByListId(list.id);
      listsWithItems.push({
        ...list,
        items,
      });
    }

    return listsWithItems;
  }

  /**
   * 创建新的想法清单
   */
  async createIdeaList(data: NewIdeaList): Promise<IdeaList> {
    // 获取当前用户清单的最大排序值
    const maxOrder = await this.db
      .select({ maxOrder: sql<number>`max(${ideaLists.order})` })
      .from(ideaLists)
      .where(eq(ideaLists.userId, data.userId!));

    const newOrder = (maxOrder[0]?.maxOrder || 0) + 1;

    const result = await this.db
      .insert(ideaLists)
      .values({
        ...data,
        order: newOrder,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * 更新想法清单
   */
  async updateIdeaList(id: number, data: Partial<IdeaList>): Promise<IdeaList | null> {
    const result = await this.db
      .update(ideaLists)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(ideaLists.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * 删除想法清单（会级联删除所有相关项目）
   */
  async deleteIdeaList(id: number): Promise<boolean> {
    const result = await this.db
      .delete(ideaLists)
      .where(eq(ideaLists.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * 批量更新想法清单排序
   */
  async updateIdeaListsOrder(orderedIds: number[]): Promise<boolean> {
    try {
      await this.db.transaction(async (tx) => {
        for (let i = 0; i < orderedIds.length; i++) {
          await tx
            .update(ideaLists)
            .set({ 
              order: i + 1,
              updatedAt: new Date(),
            })
            .where(eq(ideaLists.id, orderedIds[i]));
        }
      });
      return true;
    } catch (error) {
      console.error('更新清单排序失败:', error);
      return false;
    }
  }

  // ===== 想法项目操作 =====

  /**
   * 获取指定清单的所有项目
   */
  async getIdeaItemsByListId(listId: number): Promise<IdeaItem[]> {
    return await this.db
      .select()
      .from(ideaItems)
      .where(eq(ideaItems.listId, listId))
      .orderBy(asc(ideaItems.order), desc(ideaItems.createdAt));
  }

  /**
   * 创建新的想法项目
   */
  async createIdeaItem(data: NewIdeaItem): Promise<IdeaItem> {
    // 获取当前清单中项目的最大排序值
    const maxOrder = await this.db
      .select({ maxOrder: sql<number>`max(${ideaItems.order})` })
      .from(ideaItems)
      .where(eq(ideaItems.listId, data.listId!));

    const newOrder = (maxOrder[0]?.maxOrder || 0) + 1;

    const result = await this.db
      .insert(ideaItems)
      .values({
        ...data,
        order: newOrder,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * 更新想法项目
   */
  async updateIdeaItem(id: number, data: Partial<IdeaItem>): Promise<IdeaItem | null> {
    const result = await this.db
      .update(ideaItems)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(ideaItems.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * 删除想法项目
   */
  async deleteIdeaItem(id: number): Promise<boolean> {
    const result = await this.db
      .delete(ideaItems)
      .where(eq(ideaItems.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * 切换想法项目的完成状态
   */
  async toggleIdeaItemComplete(id: number): Promise<IdeaItem | null> {
    // 先获取当前状态
    const currentItem = await this.db
      .select()
      .from(ideaItems)
      .where(eq(ideaItems.id, id))
      .limit(1);

    if (currentItem.length === 0) {
      return null;
    }

    // 切换状态
    const result = await this.db
      .update(ideaItems)
      .set({
        isCompleted: !currentItem[0].isCompleted,
        updatedAt: new Date(),
      })
      .where(eq(ideaItems.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * 批量更新想法项目排序
   */
  async updateIdeaItemsOrder(listId: number, orderedIds: number[]): Promise<boolean> {
    try {
      await this.db.transaction(async (tx) => {
        for (let i = 0; i < orderedIds.length; i++) {
          await tx
            .update(ideaItems)
            .set({ 
              order: i + 1,
              updatedAt: new Date(),
            })
            .where(and(
              eq(ideaItems.id, orderedIds[i]),
              eq(ideaItems.listId, listId)
            ));
        }
      });
      return true;
    } catch (error) {
      console.error('更新项目排序失败:', error);
      return false;
    }
  }

  /**
   * 获取单个想法清单
   */
  async getIdeaListById(id: number): Promise<IdeaList | null> {
    const result = await this.db
      .select()
      .from(ideaLists)
      .where(eq(ideaLists.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 获取单个想法项目
   */
  async getIdeaItemById(id: number): Promise<IdeaItem | null> {
    const result = await this.db
      .select()
      .from(ideaItems)
      .where(eq(ideaItems.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 批量删除想法项目
   */
  async batchDeleteIdeaItems(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;

    const result = await this.db
      .delete(ideaItems)
      .where(sql`${ideaItems.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
      .returning();

    return result.length;
  }

  /**
   * 批量更新想法项目完成状态
   */
  async batchToggleIdeaItemsComplete(ids: number[], isCompleted: boolean): Promise<number> {
    if (ids.length === 0) return 0;

    const result = await this.db
      .update(ideaItems)
      .set({
        isCompleted,
        updatedAt: new Date(),
      })
      .where(sql`${ideaItems.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
      .returning();

    return result.length;
  }

  async convertItemToList(
    itemId: number,
    userId: string,
    input: ConvertToListInput,
  ): Promise<IdeaList | null> {
    const existingItem = await this.getIdeaItemById(itemId);
    if (!existingItem) return null;
    const list = await this.getIdeaListById(existingItem.listId);
    if (!list || list.userId !== userId) return null;

    if (input.deleteOriginal) {
      await this.deleteIdeaItem(itemId);
    }

    const newList = await this.createIdeaList({
      userId,
      name: input.name,
      description: input.description ?? null,
      color: input.color || 'blue',
    });

    await this.createIdeaItem({
      listId: newList.id,
      title: existingItem.title,
      description: existingItem.description,
      priority: existingItem.priority || 'medium',
      tags: existingItem.tags || [],
    });

    return newList;
  }
}

export function createIdeaListDbService(db: IdeaListDrizzleDb) {
  return new IdeaListDbService(db);
}
