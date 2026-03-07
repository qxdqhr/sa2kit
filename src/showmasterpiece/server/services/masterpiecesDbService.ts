// @ts-nocheck
let db: any;
let fileUrlResolver: ((fileId: string) => Promise<string | null | undefined>) | undefined;

export function initializeShowmasterpieceDb(
  database: any,
  resolver?: (fileId: string) => Promise<string | null | undefined>,
): void {
  db = database;
  fileUrlResolver = resolver;
  (globalThis as any).__sa2kitShowmasterpieceResolveFileUrl = resolver;
}

import { 
  comicUniverseConfigs,
  comicUniverseCategories,
  comicUniverseTags,
  comicUniverseCollections,
  comicUniverseCollectionTags,
  comicUniverseArtworks
} from '../schema/masterpieces';
import { eq, desc, asc, and, sql, inArray } from 'drizzle-orm';
import {
  buildDefaultHomeTabConfig,
  normalizeHomeTabConfig,
  normalizeMiniappFloatingButtonsConfig,
} from '../../types';

interface MasterpiecesConfig {
  siteName: string;
  siteDescription?: string;
  heroTitle: string;
  heroSubtitle?: string;
  maxCollectionsPerPage: number;
  enableSearch: boolean;
  enableCategories: boolean;
  homeTabConfig: any[];
  miniappFloatingButtons: {
    showCart: boolean;
    showHistory: boolean;
  };
  defaultCategory: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en';
}

type CollectionCategoryType = string;

interface ArtworkPage {
  id: number;
  title: string;
  number: string;
  image: string;
  fileId?: string;
  description: string;
  createdTime?: string;
  theme?: string;
  pageOrder: number;
}

interface ArtCollection {
  id: number;
  title: string;
  number: string;
  coverImage: string;
  coverImageFileId?: string;
  description: string;
  pages: ArtworkPage[];
  category: CollectionCategoryType;
  tags?: string[];
  isPublished?: boolean;
  price?: number;
}

interface CollectionFormData {
  title: string;
  number: string;
  coverImage: string;
  coverImageFileId?: string;
  description: string;
  category: CollectionCategoryType;
  tags: string[];
  isPublished: boolean;
  price?: number;
}

interface ArtworkFormData {
  title: string;
  number: string;
  image?: string;
  fileId?: string;
  description: string;
  createdTime?: string;
  theme?: string;
}

async function resolveFileUrlMap(fileIds: string[]): Promise<Map<string, string>> {
  const fileIdToUrlMap = new Map<string, string>();

  if (!fileUrlResolver || fileIds.length === 0) {
    return fileIdToUrlMap;
  }

  const results = await Promise.all(
    fileIds.map(async (fileId) => {
      try {
        const fileUrl = await fileUrlResolver!(fileId);
        return { fileId, url: fileUrl || null };
      } catch (error) {
        return { fileId, url: null };
      }
    }),
  );

  results.forEach((result) => {
    if (result.url) {
      fileIdToUrlMap.set(result.fileId, result.url);
    }
  });

  return fileIdToUrlMap;
}

// 配置相关服务
export class MasterpiecesConfigDbService {
  // 获取配置
  async getConfig(): Promise<MasterpiecesConfig> {
    const configs = await db.select().from(comicUniverseConfigs).limit(1);
    
    if (configs.length === 0) {
      // 如果没有配置，创建默认配置
      const defaultConfig = await this.createDefaultConfig();
      return this.mapDbConfigToType(defaultConfig);
    }
    
    return this.mapDbConfigToType(configs[0]);
  }

  // 更新配置
  async updateConfig(configData: Partial<MasterpiecesConfig>): Promise<MasterpiecesConfig> {
    const configs = await db.select().from(comicUniverseConfigs).limit(1);
    
    if (configs.length === 0) {
      // 如果没有配置，创建新配置
      const newConfig = await db.insert(comicUniverseConfigs).values({
        siteName: configData.siteName || '画集展览',
        siteDescription: configData.siteDescription || '精美的艺术作品展览',
        heroTitle: configData.heroTitle || '艺术画集展览',
        heroSubtitle: configData.heroSubtitle || '探索精美的艺术作品，感受创作的魅力',
        maxCollectionsPerPage: configData.maxCollectionsPerPage || 9,
        enableSearch: configData.enableSearch ?? true,
        enableCategories: configData.enableCategories ?? true,
        homeTabConfig: normalizeHomeTabConfig(configData.homeTabConfig),
        miniappFloatingButtons: normalizeMiniappFloatingButtonsConfig(
          configData.miniappFloatingButtons,
        ),
        defaultCategory: configData.defaultCategory || 'all',
        theme: configData.theme || 'light',
        language: configData.language || 'zh',
        updatedAt: new Date(),
      }).returning();
      
      return this.mapDbConfigToType(newConfig[0]);
    } else {
      // 更新现有配置
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      // 只更新提供的字段
      if (configData.siteName !== undefined) updateData.siteName = configData.siteName;
      if (configData.siteDescription !== undefined) updateData.siteDescription = configData.siteDescription;
      if (configData.heroTitle !== undefined) updateData.heroTitle = configData.heroTitle;
      if (configData.heroSubtitle !== undefined) updateData.heroSubtitle = configData.heroSubtitle;
      if (configData.maxCollectionsPerPage !== undefined) updateData.maxCollectionsPerPage = configData.maxCollectionsPerPage;
      if (configData.enableSearch !== undefined) updateData.enableSearch = configData.enableSearch;
      if (configData.enableCategories !== undefined) updateData.enableCategories = configData.enableCategories;
      if (configData.homeTabConfig !== undefined) updateData.homeTabConfig = normalizeHomeTabConfig(configData.homeTabConfig);
      if (configData.miniappFloatingButtons !== undefined) {
        updateData.miniappFloatingButtons = normalizeMiniappFloatingButtonsConfig(
          configData.miniappFloatingButtons,
        );
      }
      if (configData.defaultCategory !== undefined) updateData.defaultCategory = configData.defaultCategory;
      if (configData.theme !== undefined) updateData.theme = configData.theme;
      if (configData.language !== undefined) updateData.language = configData.language;

      const updatedConfig = await db.update(comicUniverseConfigs)
        .set(updateData)
        .where(eq(comicUniverseConfigs.id, configs[0].id))
        .returning();
      
      return this.mapDbConfigToType(updatedConfig[0]);
    }
  }

  // 重置为默认配置
  async resetConfig(): Promise<MasterpiecesConfig> {
    await db.delete(comicUniverseConfigs);
    const defaultConfig = await this.createDefaultConfig();
    return this.mapDbConfigToType(defaultConfig);
  }

  // 创建默认配置
  private async createDefaultConfig() {
    const newConfig = await db.insert(comicUniverseConfigs).values({
      siteName: '画集展览',
      siteDescription: '精美的艺术作品展览',
      heroTitle: '艺术画集展览',
      heroSubtitle: '探索精美的艺术作品，感受创作的魅力',
      maxCollectionsPerPage: 9,
      enableSearch: true,
      enableCategories: true,
      homeTabConfig: buildDefaultHomeTabConfig(),
      miniappFloatingButtons: normalizeMiniappFloatingButtonsConfig(undefined),
      defaultCategory: 'all',
      theme: 'light',
      language: 'zh',
    }).returning();
    
    return newConfig[0];
  }

  // 映射数据库配置到类型
  private mapDbConfigToType(dbConfig: any): MasterpiecesConfig {
    return {
      siteName: dbConfig.siteName,
      siteDescription: dbConfig.siteDescription,
      heroTitle: dbConfig.heroTitle,
      heroSubtitle: dbConfig.heroSubtitle,
      maxCollectionsPerPage: dbConfig.maxCollectionsPerPage,
      enableSearch: dbConfig.enableSearch,
      enableCategories: dbConfig.enableCategories,
      homeTabConfig: normalizeHomeTabConfig(dbConfig.homeTabConfig),
      miniappFloatingButtons: normalizeMiniappFloatingButtonsConfig(
        dbConfig.miniappFloatingButtons,
      ),
      defaultCategory: dbConfig.defaultCategory,
      theme: dbConfig.theme,
      language: dbConfig.language,
    };
  }
}

// 分类相关服务
export class CategoriesDbService {
  // 获取所有分类
  async getCategories(): Promise<Array<{ name: string; description?: string | null }>> {
    const conditions = [eq(comicUniverseCategories.isActive, true)];
    
    const categories = await db.select()
      .from(comicUniverseCategories)
      .where(and(...conditions))
      .orderBy(asc(comicUniverseCategories.displayOrder), asc(comicUniverseCategories.name));
    
    console.log(`📊 [CategoriesDbService] 获取分类: 返回${categories.length}个分类`);
    return categories.map(cat => ({
      name: cat.name,
      description: cat.description ?? null,
    }));
  }

  // 创建分类
  async createCategory(name: string, description?: string): Promise<void> {
    await db.insert(comicUniverseCategories).values({
      name,
      description,
    });
  }
}

// 标签相关服务
export class TagsDbService {
  // 获取所有标签
  async getTags(): Promise<string[]> {
    const conditions = [eq(comicUniverseTags.isActive, true)];
    
    const tags = await db.select()
      .from(comicUniverseTags)
      .where(and(...conditions))
      .orderBy(asc(comicUniverseTags.name));
    
    console.log(`📊 [TagsDbService] 获取标签: 返回${tags.length}个标签`);
    return tags.map(tag => tag.name);
  }

  // 创建标签
  async createTag(name: string, color?: string): Promise<void> {
    await db.insert(comicUniverseTags).values({
      name,
      color: color || '#3b82f6',
    });
  }
}

// 画集相关服务
export class CollectionsDbService {
  // 缓存配置 - 多层缓存策略
  private collectionsCache: ArtCollection[] | null = null;
  private collectionsCacheTime: number = 0;
  private collectionsOverviewCache: Omit<ArtCollection, 'pages'>[] | null = null;
  private collectionsOverviewCacheTime: number = 0;
  
  // 优化缓存时间配置
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 延长到10分钟
  private readonly OVERVIEW_CACHE_DURATION = 15 * 60 * 1000; // 概览缓存15分钟
  private readonly STALE_WHILE_REVALIDATE = 30 * 60 * 1000; // 过期后30分钟内可用

  /**
   * 获取所有画集 - 优化版本
   * 
   * 性能问题分析:
   * 1. 复杂的多表关联查询 - 涉及5个表的数据整合
   * 2. 作品数据量大 - 包含所有作品的完整信息（特别是图片数据）
   * 3. N+1查询风险 - 虽然使用并行查询，但仍有优化空间
   * 4. 缓存策略有限 - 2分钟缓存时间较短，首次访问必须全量查询
   * 
   * 优化策略:
   * ✅ 并行查询 - 分类、标签、作品数据并行获取
   * ✅ 内存缓存 - 减少重复查询
   * ✅ 字段选择 - 只查询必要字段
   * ✅ 延长缓存时间 - 从2分钟增加到10分钟
   * ⚠️ 需要优化 - 数据库索引、分页加载、图片懒加载
   */
  async getAllCollections(useCache: boolean = true): Promise<ArtCollection[]> {
    // 检查缓存 - 首次访问时缓存为空，必须执行完整查询
    if (useCache && this.collectionsCache) {
      const cacheAge = Date.now() - this.collectionsCacheTime;
      
      // 如果在有效期内，直接返回缓存
      if (cacheAge < this.CACHE_DURATION) {
        return this.collectionsCache;
      }
      
      // 如果在stale-while-revalidate期内，返回缓存但异步更新
      if (cacheAge < this.STALE_WHILE_REVALIDATE) {
        // 异步更新缓存，不阻塞当前请求
        this.refreshCacheInBackground();
        return this.collectionsCache;
      }
    }

    try {
      // 执行完整查询
      const result = await this.fetchAllCollectionsFromDb();
      
      // 更新缓存
      this.collectionsCache = result;
      this.collectionsCacheTime = Date.now();

      return result;

    } catch (error) {
      console.error('获取画集数据失败:', error);
      
      // 如果查询失败但有过期缓存，返回过期缓存
      if (this.collectionsCache) {
        console.warn('数据库查询失败，返回过期缓存数据');
        return this.collectionsCache;
      }
      
      throw error;
    }
  }

  /**
   * 获取画集概览 - 不包含作品详情的轻量版本
   * 适用于首页列表、搜索结果等场景
   */
  async getCollectionsOverview(): Promise<Omit<ArtCollection, 'pages'>[]> {
    // 检查概览缓存
    if (this.collectionsOverviewCache) {
      const cacheAge = Date.now() - this.collectionsOverviewCacheTime;
      
      if (cacheAge < this.OVERVIEW_CACHE_DURATION) {
        return this.collectionsOverviewCache;
      }
      
      // stale-while-revalidate策略
      if (cacheAge < this.STALE_WHILE_REVALIDATE) {
        this.refreshOverviewCacheInBackground();
        return this.collectionsOverviewCache;
      }
    }

    try {
      const result = await this.fetchCollectionsOverviewFromDb();
      
      // 更新缓存
      this.collectionsOverviewCache = result;
      this.collectionsOverviewCacheTime = Date.now();

      return result;

    } catch (error) {
      console.error('获取画集概览失败:', error);
      
      // 降级策略：返回过期缓存
      if (this.collectionsOverviewCache) {
        console.warn('数据库查询失败，返回过期缓存数据');
        return this.collectionsOverviewCache;
      }
      
      throw error;
    }
  }

  /**
   * 后台异步刷新完整缓存
   */
  private async refreshCacheInBackground(): Promise<void> {
    try {
      const result = await this.fetchAllCollectionsFromDb();
      this.collectionsCache = result;
      this.collectionsCacheTime = Date.now();
      console.log('缓存已在后台更新');
    } catch (error) {
      console.error('后台缓存更新失败:', error);
    }
  }

  /**
   * 后台异步刷新概览缓存
   */
  private async refreshOverviewCacheInBackground(): Promise<void> {
    try {
      const result = await this.fetchCollectionsOverviewFromDb();
      this.collectionsOverviewCache = result;
      this.collectionsOverviewCacheTime = Date.now();
      console.log('概览缓存已在后台更新');
    } catch (error) {
      console.error('后台概览缓存更新失败:', error);
    }
  }

  /**
   * 从数据库获取完整画集数据
   * 优化版本：不再返回Base64图片数据，只返回fileId和imageUrl
   */
  private async fetchAllCollectionsFromDb(): Promise<ArtCollection[]> {
    try {
      // 1. 获取画集基本信息
      const collections = await db
        .select({
          id: comicUniverseCollections.id,
          title: comicUniverseCollections.title,
          number: comicUniverseCollections.number,
          coverImage: comicUniverseCollections.coverImage,
          coverImageFileId: comicUniverseCollections.coverImageFileId, // 新增：封面图片文件ID
          description: comicUniverseCollections.description,
          isPublished: comicUniverseCollections.isPublished,
          displayOrder: comicUniverseCollections.displayOrder,
          price: comicUniverseCollections.price,
          createdAt: comicUniverseCollections.createdAt,
          categoryId: comicUniverseCollections.categoryId,
        })
        .from(comicUniverseCollections)
        .where(eq(comicUniverseCollections.isPublished, true))
        .orderBy(
          desc(comicUniverseCollections.displayOrder),
          desc(comicUniverseCollections.createdAt)
        );

      if (collections.length === 0) {
        return [];
      }

      const collectionIds = collections.map(c => c.id);

      // 2. 并行获取分类、标签和作品数据
      const [categories, tags, artworks] = await Promise.all([
        // 获取分类信息
        db
          .select({
            id: comicUniverseCategories.id,
            name: comicUniverseCategories.name,
          })
          .from(comicUniverseCategories)
          .where(eq(comicUniverseCategories.isActive, true)),

        // 获取标签信息
        db
          .select({
            collectionId: comicUniverseCollectionTags.collectionId,
            tagName: comicUniverseTags.name,
          })
          .from(comicUniverseCollectionTags)
          .innerJoin(
            comicUniverseTags,
            eq(comicUniverseCollectionTags.tagId, comicUniverseTags.id)
          )
          .where(
            and(
              inArray(comicUniverseCollectionTags.collectionId, collectionIds),
              eq(comicUniverseTags.isActive, true)
            )
          ),

        // 获取作品数据（只查询fileId，不查询Base64图片）
        db
          .select({
            collectionId: comicUniverseArtworks.collectionId,
            id: comicUniverseArtworks.id,
            title: comicUniverseArtworks.title,
            number: comicUniverseArtworks.number,
            fileId: comicUniverseArtworks.fileId, // 只查询fileId，不查询Base64图片
            description: comicUniverseArtworks.description,
            createdTime: comicUniverseArtworks.createdTime,
            theme: comicUniverseArtworks.theme,
            pageOrder: comicUniverseArtworks.pageOrder,
          })
          .from(comicUniverseArtworks)
          .where(
            and(
              inArray(comicUniverseArtworks.collectionId, collectionIds),
              eq(comicUniverseArtworks.isActive, true)
            )
          )
          .orderBy(asc(comicUniverseArtworks.pageOrder))
      ]);

      // 3. 构建映射表
      const categoriesMap = new Map(categories.map(cat => [cat.id, cat.name]));
      
      const tagsMap = new Map<number, string[]>();
      tags.forEach(tag => {
        if (!tagsMap.has(tag.collectionId)) {
          tagsMap.set(tag.collectionId, []);
        }
        tagsMap.get(tag.collectionId)!.push(tag.tagName);
      });

      // 4. 批量获取文件URL（包括封面图片）
      const fileIdToUrlMap = new Map<string, string>();
      const allFileIds = [
        ...collections.filter(c => c.coverImageFileId).map(c => c.coverImageFileId!),
        ...artworks.filter(a => a.fileId).map(a => a.fileId!)
      ];
      
      if (allFileIds.length > 0) {
        try {
          // 使用ShowMasterpiece的独立文件服务配置
          const { getShowMasterpieceFileConfig } = await import('../services/fileService');
          const configManager = await getShowMasterpieceFileConfig();
          const { UniversalFileService } = await import('../../../universalFile/server/UniversalFileService');
          
          const fileService = new UniversalFileService(configManager.getConfig());
          await fileService.initialize();
          
          // 并行获取所有文件URL
          const urlPromises = allFileIds.map(async (fileId) => {
            try {
              const fileUrl = await fileService.getFileUrl(fileId);
              return { fileId, url: fileUrl };
            } catch (error) {
              console.warn(`⚠️ 获取文件URL失败: ${fileId}`, error);
              return { fileId, url: null };
            }
          });
          
          const urlResults = await Promise.all(urlPromises);
          urlResults.forEach(result => {
            if (result.url) {
              fileIdToUrlMap.set(result.fileId, result.url);
            }
          });
        } catch (error) {
          console.warn('⚠️ 批量获取文件URL失败:', error);
        }
      }

      // 5. 构建作品映射表
      const artworksMap = new Map<number, ArtworkPage[]>();
      
      artworks.forEach(artwork => {
        if (!artworksMap.has(artwork.collectionId)) {
          artworksMap.set(artwork.collectionId, []);
        }
        
        // 创建基础作品对象，优先使用OSS URL，回退到API路径
        let imageUrl: string;
        if (artwork.fileId && fileIdToUrlMap.has(artwork.fileId)) {
          imageUrl = fileIdToUrlMap.get(artwork.fileId)!;
        } else {
          // 如果没有fileId或获取URL失败，使用API路径
          imageUrl = `/api/showmasterpiece/collections/${artwork.collectionId}/artworks/${artwork.id}/image`;
        }
        
        const artworkPage: ArtworkPage = {
          id: artwork.id,
          title: artwork.title || '',
          number: artwork.number || '',
          image: imageUrl, // 使用处理后的图片URL
          fileId: artwork.fileId || undefined, // 添加fileId支持
          description: artwork.description || '',
          createdTime: artwork.createdTime || '',
          theme: artwork.theme || '',
          pageOrder: artwork.pageOrder || 0, // 添加pageOrder字段
        };
        
        artworksMap.get(artwork.collectionId)!.push(artworkPage);
      });

      // 6. 构建最终结果
      return collections.map(collection => {
        // 处理封面图片URL
        let coverImageUrl: string;
        if (collection.coverImageFileId && fileIdToUrlMap.has(collection.coverImageFileId)) {
          // 优先使用OSS URL
          coverImageUrl = fileIdToUrlMap.get(collection.coverImageFileId)!;
          console.log(`🔗 [CollectionsDbService] 使用OSS URL: ${coverImageUrl}`);
        } else if (collection.coverImage) {
          // 回退到原始路径
          coverImageUrl = collection.coverImage;
          console.log(`🔗 [CollectionsDbService] 使用原始路径: ${coverImageUrl}`);
        } else {
          // 没有封面图片
          coverImageUrl = '';
          console.log(`🔗 [CollectionsDbService] 无封面图片`);
        }

        return {
          id: collection.id,
          title: collection.title,
          number: collection.number,
          coverImage: coverImageUrl, // ✅ 使用处理后的URL
          coverImageFileId: collection.coverImageFileId || undefined,
          description: collection.description || '',
          category: collection.categoryId ? (categoriesMap.get(collection.categoryId) || '画集') as CollectionCategoryType : '画集' as CollectionCategoryType,
          tags: tagsMap.get(collection.id) || [],
          isPublished: collection.isPublished,
          price: collection.price || undefined,
          pages: artworksMap.get(collection.id) || [], // 🚀 作品数据精简，大幅减少传输量
        };
      });
    } catch (error) {
      console.error('获取画集列表失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库获取画集概览数据
   */
  private async fetchCollectionsOverviewFromDb(): Promise<Omit<ArtCollection, 'pages'>[]> {
    try {
      // 1. 获取画集基本信息
      const collections = await db
        .select({
          id: comicUniverseCollections.id,
          title: comicUniverseCollections.title,
          number: comicUniverseCollections.number,
          coverImage: comicUniverseCollections.coverImage,
          coverImageFileId: comicUniverseCollections.coverImageFileId, // 新增：封面图片文件ID
          description: comicUniverseCollections.description,
          isPublished: comicUniverseCollections.isPublished,
          displayOrder: comicUniverseCollections.displayOrder,
          price: comicUniverseCollections.price,
          createdAt: comicUniverseCollections.createdAt,
          categoryId: comicUniverseCollections.categoryId,
        })
        .from(comicUniverseCollections)
        .where(eq(comicUniverseCollections.isPublished, true))
        .orderBy(
          desc(comicUniverseCollections.displayOrder),
          desc(comicUniverseCollections.createdAt)
        );

      if (collections.length === 0) {
        return [];
      }

      const collectionIds = collections.map(c => c.id);

      // 2. 并行获取分类、标签和作品数量
      const [categories, tags, artworkCounts] = await Promise.all([
        // 获取分类信息
        db
          .select({
            id: comicUniverseCategories.id,
            name: comicUniverseCategories.name,
          })
          .from(comicUniverseCategories)
          .where(eq(comicUniverseCategories.isActive, true)),

        // 获取标签信息
        db
          .select({
            collectionId: comicUniverseCollectionTags.collectionId,
            tagName: comicUniverseTags.name,
          })
          .from(comicUniverseCollectionTags)
          .innerJoin(
            comicUniverseTags,
            eq(comicUniverseCollectionTags.tagId, comicUniverseTags.id)
          )
          .where(
            and(
              inArray(comicUniverseCollectionTags.collectionId, collectionIds),
              eq(comicUniverseTags.isActive, true)
            )
          ),

        // 获取作品数量（而不是具体作品）
        db
          .select({
            collectionId: comicUniverseArtworks.collectionId,
            count: sql<number>`count(*)`.as('count'),
          })
          .from(comicUniverseArtworks)
          .where(
            and(
              inArray(comicUniverseArtworks.collectionId, collectionIds),
              eq(comicUniverseArtworks.isActive, true)
            )
          )
          .groupBy(comicUniverseArtworks.collectionId)
      ]);

      // 3. 构建映射表
      const categoriesMap = new Map(categories.map(cat => [cat.id, cat.name]));
      
      const tagsMap = new Map<number, string[]>();
      tags.forEach(tag => {
        if (!tagsMap.has(tag.collectionId)) {
          tagsMap.set(tag.collectionId, []);
        }
        tagsMap.get(tag.collectionId)!.push(tag.tagName);
      });

      const artworkCountsMap = new Map(artworkCounts.map(ac => [ac.collectionId, ac.count]));

      // 4. 批量获取封面图片URL
      const fileIdToUrlMap = new Map<string, string>();
      const coverImageFileIds = collections.filter(c => c.coverImageFileId).map(c => c.coverImageFileId!);
      
      if (coverImageFileIds.length > 0) {
        try {
          // 使用ShowMasterpiece的独立文件服务配置
          const { getShowMasterpieceFileConfig } = await import('../services/fileService');
          const configManager = await getShowMasterpieceFileConfig();
          const { UniversalFileService } = await import('../../../universalFile/server/UniversalFileService');
          
          const fileService = new UniversalFileService(configManager.getConfig());
          await fileService.initialize();
          
          // 并行获取所有封面图片URL
          const urlPromises = coverImageFileIds.map(async (fileId) => {
            try {
              const fileUrl = await fileService.getFileUrl(fileId);
              return { fileId, url: fileUrl };
            } catch (error) {
              console.warn(`⚠️ [CollectionsDbService] 获取封面图片URL失败: ${fileId}`, error);
              return { fileId, url: null };
            }
          });
          
          const urlResults = await Promise.all(urlPromises);
          urlResults.forEach(result => {
            if (result.url) {
              fileIdToUrlMap.set(result.fileId, result.url);
            }
          });
        } catch (error) {
          console.warn('⚠️ [CollectionsDbService] 批量获取封面图片URL失败:', error);
        }
      }

      // 5. 构建结果（包含作品数量而不是具体作品）
      return collections.map(collection => {
        // 处理封面图片URL，优先使用OSS URL，回退到原始路径
        let coverImageUrl: string;
        if (collection.coverImageFileId && fileIdToUrlMap.has(collection.coverImageFileId)) {
          coverImageUrl = fileIdToUrlMap.get(collection.coverImageFileId)!;
        } else {
          // 如果没有fileId或获取URL失败，使用原始路径
          coverImageUrl = collection.coverImage || '';
        }
        console.log(`🔗 [CollectionsDbService] 1封面图片URL: ${coverImageUrl}`);

        return {
          id: collection.id,
          title: collection.title,
          number: collection.number,
          coverImage: coverImageUrl, // 使用处理后的封面图片URL
          coverImageFileId: collection.coverImageFileId || undefined, // 新增：封面图片文件ID
          description: collection.description || '',
          category: collection.categoryId ? (categoriesMap.get(collection.categoryId) || '画集') as CollectionCategoryType : '画集' as CollectionCategoryType,
          tags: tagsMap.get(collection.id) || [],
          isPublished: collection.isPublished,
          price: collection.price || undefined,
          artworkCount: artworkCountsMap.get(collection.id) || 0,
        };
      });

    } catch (error) {
      console.error('获取画集概览失败:', error);
      throw error;
    }
  }

  // 清除缓存的方法
  clearCache(): void {
    this.collectionsCache = null;
    this.collectionsCacheTime = 0;
    this.collectionsOverviewCache = null;
    this.collectionsOverviewCacheTime = 0;
  }

  // 创建画集
  async createCollection(collectionData: CollectionFormData): Promise<ArtCollection> {
    // 获取或创建分类
    let categoryId: number | null = null;
    if (collectionData.category) {
      const existingCategory = await db.select()
        .from(comicUniverseCategories)
        .where(eq(comicUniverseCategories.name, collectionData.category))
        .limit(1);
      
      if (existingCategory.length > 0) {
        categoryId = existingCategory[0].id;
      } else {
        const newCategory = await db.insert(comicUniverseCategories).values({
          name: collectionData.category,
        }).returning();
        categoryId = newCategory[0].id;
      }
    }

    // 创建画集
    const newCollection = await db.insert(comicUniverseCollections).values({
      title: collectionData.title,
      number: collectionData.number,
      coverImage: collectionData.coverImage,
      coverImageFileId: collectionData.coverImageFileId || null,
      description: collectionData.description,
      categoryId,
      isPublished: collectionData.isPublished,
      publishedAt: collectionData.isPublished ? new Date() : null,
      price: collectionData.price || null,
    }).returning();

    // 处理标签
    if (collectionData.tags && collectionData.tags.length > 0) {
      await this.updateCollectionTags(newCollection[0].id, collectionData.tags);
    }

    // 清除缓存
    this.clearCache();

    // 返回完整的画集数据
    const collections = await this.getAllCollections(false); // 强制重新查询
   const filterCollection = collections.filter(c => c.id === newCollection[0].id);
   console.log('🎨 [createCollection] 创建画集成功:', filterCollection);
    return filterCollection[0];
  }

  // 更新画集
  async updateCollection(id: number, collectionData: CollectionFormData): Promise<ArtCollection> {
    // 获取或创建分类
    let categoryId: number | null = null;
    if (collectionData.category) {
      const existingCategory = await db.select()
        .from(comicUniverseCategories)
        .where(eq(comicUniverseCategories.name, collectionData.category))
        .limit(1);
      
      if (existingCategory.length > 0) {
        categoryId = existingCategory[0].id;
      } else {
        const newCategory = await db.insert(comicUniverseCategories).values({
          name: collectionData.category,
        }).returning();
        categoryId = newCategory[0].id;
      }
    }

    // 更新画集
    await db.update(comicUniverseCollections)
      .set({
        title: collectionData.title,
        number: collectionData.number,
        coverImage: collectionData.coverImage,
        coverImageFileId: collectionData.coverImageFileId || null,
        description: collectionData.description,
        categoryId,
        isPublished: collectionData.isPublished,
        publishedAt: collectionData.isPublished ? new Date() : null,
        price: collectionData.price || null,
        updatedAt: new Date(),
      })
      .where(eq(comicUniverseCollections.id, id));

    // 更新标签
    await this.updateCollectionTags(id, collectionData.tags || []);

    // 清除缓存
    this.clearCache();

    // 返回更新后的画集数据
    const collections = await this.getAllCollections(false); // 强制重新查询
    return collections.find(c => c.id === id)!;
  }

  // 删除画集
  async deleteCollection(id: number): Promise<void> {
    // 首先验证画集存在性
    const collection = await db
      .select({
        id: comicUniverseCollections.id,
        title: comicUniverseCollections.title,
      })
      .from(comicUniverseCollections)
      .where(eq(comicUniverseCollections.id, id))
      .limit(1);

    if (!collection.length) {
      throw new Error('画集不存在');
    }

    const collectionData = collection[0];

    console.log(`🗑️ [deleteCollection] 删除画集 ID:${id} "${collectionData.title}"`);

    // 执行删除（级联删除作品）
    await db.delete(comicUniverseCollections)
      .where(eq(comicUniverseCollections.id, id));
    
    // 清除缓存
    this.clearCache();
  }

  // 更新画集标签
  private async updateCollectionTags(collectionId: number, tagNames: string[]): Promise<void> {
    // 删除现有标签关联
    await db.delete(comicUniverseCollectionTags)
      .where(eq(comicUniverseCollectionTags.collectionId, collectionId));

    if (tagNames.length === 0) return;

    // 获取或创建标签
    const tagIds: number[] = [];
    for (const tagName of tagNames) {
      const existingTag = await db.select()
        .from(comicUniverseTags)
        .where(eq(comicUniverseTags.name, tagName))
        .limit(1);
      
      if (existingTag.length > 0) {
        tagIds.push(existingTag[0].id);
      } else {
        const newTag = await db.insert(comicUniverseTags).values({
          name: tagName,
        }).returning();
        tagIds.push(newTag[0].id);
      }
    }

    // 创建新的标签关联
    const tagRelations = tagIds.map(tagId => ({
      collectionId,
      tagId,
    }));

    await db.insert(comicUniverseCollectionTags).values(tagRelations);
  }

  // 更新画集显示顺序
  async updateCollectionOrder(collectionOrders: { id: number; displayOrder: number }[]): Promise<void> {
    try {
      // 使用事务批量更新显示顺序
      await db.transaction(async (tx) => {
        for (const { id, displayOrder } of collectionOrders) {
          await tx
            .update(comicUniverseCollections)
            .set({ 
              displayOrder,
              updatedAt: new Date()
            })
            .where(eq(comicUniverseCollections.id, id));
        }
      });

      // 清除缓存
      this.clearCache();
    } catch (error) {
      console.error('更新画集顺序失败:', error);
      throw error;
    }
  }

  // 移动画集到指定位置
  async moveCollection(collectionId: number, targetOrder: number): Promise<void> {
    try {
      // 获取当前所有已发布的画集
      const collections = await db
        .select({
          id: comicUniverseCollections.id,
          displayOrder: comicUniverseCollections.displayOrder,
          createdAt: comicUniverseCollections.createdAt,
        })
        .from(comicUniverseCollections)
        .where(eq(comicUniverseCollections.isPublished, true))
        .orderBy(
          desc(comicUniverseCollections.displayOrder),
          desc(comicUniverseCollections.createdAt),
          desc(comicUniverseCollections.id)
        );

      const normalized = await this.normalizeCollectionOrderIfNeeded(collections);
      const workingCollections = normalized ?? collections;

      // 找到要移动的画集
      const targetCollection = workingCollections.find(c => c.id === collectionId);
      if (!targetCollection) {
        throw new Error('画集不存在');
      }

      // 重新计算所有画集的显示顺序
      const sortedCollections = workingCollections.filter(c => c.id !== collectionId);
      sortedCollections.splice(targetOrder, 0, targetCollection);

      // 生成新的显示顺序，处理null值
      const updates = sortedCollections.map((collection, index) => ({
        id: collection.id,
        displayOrder: sortedCollections.length - index, // 从高到低排序
      }));

      await this.updateCollectionOrder(updates);
    } catch (error) {
      console.error('移动画集失败:', error);
      throw error;
    }
  }

  // 上移画集
  async moveCollectionUp(collectionId: number): Promise<void> {
    try {
      console.log('📊 [后端排序] 开始上移画集操作，collectionId:', collectionId);
      
      const collections = await db
        .select({
          id: comicUniverseCollections.id,
          displayOrder: comicUniverseCollections.displayOrder,
          title: comicUniverseCollections.title,
          createdAt: comicUniverseCollections.createdAt,
        })
        .from(comicUniverseCollections)
        .where(eq(comicUniverseCollections.isPublished, true))
        .orderBy(
          desc(comicUniverseCollections.displayOrder),
          desc(comicUniverseCollections.createdAt),
          desc(comicUniverseCollections.id)
        );

      const normalized = await this.normalizeCollectionOrderIfNeeded(collections);
      const workingCollections = normalized ?? collections;

      console.log('📊 [后端排序] 当前数据库排序状态 (按displayOrder降序):', {
        totalCount: workingCollections.length,
        collections: workingCollections.map((c, i) => ({
          dbIndex: i,
          id: c.id,
          title: c.title,
          displayOrder: c.displayOrder,
          note: i === 0 ? '(数据库第一条/displayOrder最大)' : i === workingCollections.length - 1 ? '(数据库最后条/displayOrder最小)' : ''
        }))
      });

      const currentIndex = workingCollections.findIndex(c => c.id === collectionId);
      if (currentIndex === -1) {
        console.error('❌ [后端排序] 画集不存在');
        throw new Error('画集不存在');
      }
      if (currentIndex === 0) {
        console.error('❌ [后端排序] 画集已经在最顶部 (displayOrder最大值)');
        throw new Error('画集已经在最顶部');
      }

      console.log('📊 [后端排序] 上移操作详情:', {
        targetCollection: {
          id: workingCollections[currentIndex].id,
          title: workingCollections[currentIndex].title,
          currentDisplayOrder: workingCollections[currentIndex].displayOrder,
          currentDbIndex: currentIndex
        },
        willSwapWith: {
          id: workingCollections[currentIndex - 1].id,
          title: workingCollections[currentIndex - 1].title,
          currentDisplayOrder: workingCollections[currentIndex - 1].displayOrder,
          currentDbIndex: currentIndex - 1
        },
        semantics: '上移=交换displayOrder值，使目标画集获得更大的displayOrder值'
      });

      // 交换当前画集和上一个画集的顺序，处理null值
      const targetIndex = currentIndex - 1;
      const currentOrder = workingCollections[targetIndex].displayOrder ?? 0;
      const targetOrder = workingCollections[currentIndex].displayOrder ?? 0;
      
      const updates = [
        { id: workingCollections[currentIndex].id, displayOrder: currentOrder },
        { id: workingCollections[targetIndex].id, displayOrder: targetOrder }
      ];

      console.log('📊 [后端排序] 将执行的更新操作:', {
        updates,
        explanation: '目标画集将获得更大的displayOrder值，从而在列表中上移'
      });

      await this.updateCollectionOrder(updates);
      
      console.log('✅ [后端排序] 上移操作完成');
    } catch (error) {
      console.error('❌ [后端排序] 上移画集失败:', error);
      throw error;
    }
  }

  // 下移画集
  async moveCollectionDown(collectionId: number): Promise<void> {
    try {
      console.log('📊 [后端排序] 开始下移画集操作，collectionId:', collectionId);
      
      const collections = await db
        .select({
          id: comicUniverseCollections.id,
          displayOrder: comicUniverseCollections.displayOrder,
          title: comicUniverseCollections.title,
          createdAt: comicUniverseCollections.createdAt,
        })
        .from(comicUniverseCollections)
        .where(eq(comicUniverseCollections.isPublished, true))
        .orderBy(
          desc(comicUniverseCollections.displayOrder),
          desc(comicUniverseCollections.createdAt),
          desc(comicUniverseCollections.id)
        );

      const normalized = await this.normalizeCollectionOrderIfNeeded(collections);
      const workingCollections = normalized ?? collections;

      console.log('📊 [后端排序] 当前数据库排序状态 (按displayOrder降序):', {
        totalCount: workingCollections.length,
        collections: workingCollections.map((c, i) => ({
          dbIndex: i,
          id: c.id,
          title: c.title,
          displayOrder: c.displayOrder,
          note: i === 0 ? '(数据库第一条/displayOrder最大)' : i === workingCollections.length - 1 ? '(数据库最后条/displayOrder最小)' : ''
        }))
      });

      const currentIndex = workingCollections.findIndex(c => c.id === collectionId);
      if (currentIndex === -1) {
        console.error('❌ [后端排序] 画集不存在');
        throw new Error('画集不存在');
      }
      if (currentIndex === workingCollections.length - 1) {
        console.error('❌ [后端排序] 画集已经在最底部 (displayOrder最小值)');
        throw new Error('画集已经在最底部');
      }

      console.log('📊 [后端排序] 下移操作详情:', {
        targetCollection: {
          id: workingCollections[currentIndex].id,
          title: workingCollections[currentIndex].title,
          currentDisplayOrder: workingCollections[currentIndex].displayOrder,
          currentDbIndex: currentIndex
        },
        willSwapWith: {
          id: workingCollections[currentIndex + 1].id,
          title: workingCollections[currentIndex + 1].title,
          currentDisplayOrder: workingCollections[currentIndex + 1].displayOrder,
          currentDbIndex: currentIndex + 1
        },
        semantics: '下移=交换displayOrder值，使目标画集获得更小的displayOrder值'
      });

      // 交换当前画集和下一个画集的顺序，处理null值
      const targetIndex = currentIndex + 1;
      const currentOrder = workingCollections[targetIndex].displayOrder ?? 0;
      const targetOrder = workingCollections[currentIndex].displayOrder ?? 0;
      
      const updates = [
        { id: workingCollections[currentIndex].id, displayOrder: currentOrder },
        { id: workingCollections[targetIndex].id, displayOrder: targetOrder }
      ];

      console.log('📊 [后端排序] 将执行的更新操作:', {
        updates,
        explanation: '目标画集将获得更小的displayOrder值，从而在列表中下移'
      });

      await this.updateCollectionOrder(updates);
      
      console.log('✅ [后端排序] 下移操作完成');
    } catch (error) {
      console.error('❌ [后端排序] 下移画集失败:', error);
      throw error;
    }
  }

  private async normalizeCollectionOrderIfNeeded(
    collections: Array<{ id: number; displayOrder: number | null; createdAt?: Date | null }>
  ): Promise<Array<{ id: number; displayOrder: number | null; createdAt?: Date | null }> | null> {
    if (collections.length <= 1) return null;

    const orders = collections.map((c) => c.displayOrder ?? 0);
    const uniqueOrders = new Set(orders);
    const hasDuplicates = uniqueOrders.size !== orders.length;
    const hasAllZero = uniqueOrders.size === 1 && orders[0] === 0;

    if (!hasDuplicates && !hasAllZero) return null;

    const updates = collections.map((collection, index) => ({
      id: collection.id,
      displayOrder: collections.length - index,
    }));

    await this.updateCollectionOrder(updates);

    return db
      .select({
        id: comicUniverseCollections.id,
        displayOrder: comicUniverseCollections.displayOrder,
        createdAt: comicUniverseCollections.createdAt,
      })
      .from(comicUniverseCollections)
      .where(eq(comicUniverseCollections.isPublished, true))
      .orderBy(
        desc(comicUniverseCollections.displayOrder),
        desc(comicUniverseCollections.createdAt),
        desc(comicUniverseCollections.id)
      );
  }
}

// 作品相关服务
export class ArtworksDbService {
  constructor(private collectionsService: CollectionsDbService) {}

  // 添加作品到画集
  async addArtworkToCollection(collectionId: number, artworkData: ArtworkFormData): Promise<ArtworkPage> {
    console.log('🗃️ [数据库] 开始添加作品到画集:', {
      collectionId,
      title: artworkData.title,
      number: artworkData.number
    });
    
    // 获取当前画集中作品的最大顺序号
    const maxOrder = await db.select({
      maxOrder: sql<number>`COALESCE(MAX(${comicUniverseArtworks.pageOrder}), -1)`
    })
      .from(comicUniverseArtworks)
      .where(eq(comicUniverseArtworks.collectionId, collectionId));

    const newOrder = (maxOrder[0]?.maxOrder || -1) + 1;
    console.log('📊 [数据库] 计算新的页面顺序:', newOrder);

    // 准备插入数据 - 只支持通用文件服务
    const insertData: any = {
      collectionId,
      title: artworkData.title,
      number: artworkData.number,
      description: artworkData.description,
      createdTime: artworkData.createdTime,
      theme: artworkData.theme,
      pageOrder: newOrder,
    };

    // 必须提供fileId
    if (!artworkData.fileId) {
      throw new Error('必须提供文件ID，请先上传图片');
    }
    
    insertData.fileId = artworkData.fileId;
    insertData.migrationStatus = 'completed';
    console.log('📁 [数据库] 使用通用文件服务ID:', artworkData.fileId);

    const newArtwork = await db.insert(comicUniverseArtworks).values(insertData).returning();

    console.log('✅ [数据库] 作品插入成功:', {
      id: newArtwork[0].id,
      collectionId: newArtwork[0].collectionId,
      pageOrder: newArtwork[0].pageOrder,
      title: newArtwork[0].title,
      fileId: newArtwork[0].fileId,
      migrationStatus: newArtwork[0].migrationStatus
    });

    // 清除画集缓存
    this.collectionsService.clearCache();
    console.log('🧹 [数据库] 缓存已清除');

    const result = {
      id: newArtwork[0].id,
      title: newArtwork[0].title,
      number: newArtwork[0].number,
      image: newArtwork[0].image || '',
      fileId: newArtwork[0].fileId || undefined,
      description: newArtwork[0].description || '',
      createdTime: newArtwork[0].createdTime || undefined,
      theme: newArtwork[0].theme || undefined,
      pageOrder: newArtwork[0].pageOrder || 0,
    };
    
    console.log('📤 [数据库] 返回作品数据:', result);
    return result;
  }

  // 更新作品
  async updateArtwork(collectionId: number, artworkId: number, artworkData: ArtworkFormData): Promise<ArtworkPage> {
    // 首先检查作品是否存在
    const existingArtwork = await db.select()
      .from(comicUniverseArtworks)
      .where(and(
        eq(comicUniverseArtworks.id, artworkId),
        eq(comicUniverseArtworks.collectionId, collectionId)
      ))
      .limit(1);

    if (existingArtwork.length === 0) {
      throw new Error(`作品不存在或不属于指定画集 (作品ID: ${artworkId}, 画集ID: ${collectionId})`);
    }

    // 准备更新数据 - 只支持通用文件服务
    const updateData: any = {
      title: artworkData.title,
      number: artworkData.number,
      description: artworkData.description,
      createdTime: artworkData.createdTime,
      theme: artworkData.theme,
      updatedAt: new Date(),
    };

    // 如果提供了新的fileId，则更新
    if (artworkData.fileId) {
      updateData.fileId = artworkData.fileId;
      updateData.migrationStatus = 'completed';
      // 清空旧的image字段
      updateData.image = null;
      console.log('📁 [数据库] 更新通用文件服务ID:', artworkData.fileId);
    }

    const updatedArtwork = await db.update(comicUniverseArtworks)
      .set(updateData)
      .where(and(
        eq(comicUniverseArtworks.id, artworkId),
        eq(comicUniverseArtworks.collectionId, collectionId)
      ))
      .returning();

    if (updatedArtwork.length === 0) {
      throw new Error('更新作品失败，未返回数据');
    }

    // 清除画集缓存
    this.collectionsService.clearCache();

    return {
      id: updatedArtwork[0].id,
      title: updatedArtwork[0].title,
      number: updatedArtwork[0].number,
      image: updatedArtwork[0].image || '',
      fileId: updatedArtwork[0].fileId || undefined,
      description: updatedArtwork[0].description || '',
      createdTime: updatedArtwork[0].createdTime || '',
      theme: updatedArtwork[0].theme || '',
      pageOrder: updatedArtwork[0].pageOrder || 0,
    };
  }

  // 删除作品
  async deleteArtwork(collectionId: number, artworkId: number): Promise<void> {
    // 首先验证作品存在性
    const artworkWithCollection = await db
      .select({
        artworkId: comicUniverseArtworks.id,
        artworkTitle: comicUniverseArtworks.title,
        collectionId: comicUniverseCollections.id,
        collectionTitle: comicUniverseCollections.title,
      })
      .from(comicUniverseArtworks)
      .leftJoin(comicUniverseCollections, eq(comicUniverseArtworks.collectionId, comicUniverseCollections.id))
      .where(and(
        eq(comicUniverseArtworks.id, artworkId),
        eq(comicUniverseArtworks.collectionId, collectionId)
      ))
      .limit(1);

    if (!artworkWithCollection.length) {
      throw new Error('作品不存在或不属于指定画集');
    }

    const artwork = artworkWithCollection[0];

    console.log(`🗑️ [deleteArtwork] 删除作品 ID:${artworkId} "${artwork.artworkTitle}" 从画集 ID:${collectionId} "${artwork.collectionTitle}"`);

    // 执行删除
    await db.delete(comicUniverseArtworks)
      .where(and(
        eq(comicUniverseArtworks.id, artworkId),
        eq(comicUniverseArtworks.collectionId, collectionId)
      ));

    // 清除画集缓存
    this.collectionsService.clearCache();
  }

  // 更新作品显示顺序
  async updateArtworkOrder(collectionId: number, artworkOrders: { id: number; pageOrder: number }[]): Promise<void> {
    try {
      // 使用事务批量更新显示顺序
      await db.transaction(async (tx) => {
        for (const { id, pageOrder } of artworkOrders) {
          await tx
            .update(comicUniverseArtworks)
            .set({ 
              pageOrder,
              updatedAt: new Date()
            })
            .where(and(
              eq(comicUniverseArtworks.id, id),
              eq(comicUniverseArtworks.collectionId, collectionId)
            ));
        }
      });

      // 清除画集缓存
      this.collectionsService.clearCache();
    } catch (error) {
      console.error('更新作品顺序失败:', error);
      throw error;
    }
  }

  // 移动作品到指定位置
  async moveArtwork(collectionId: number, artworkId: number, targetOrder: number): Promise<void> {
    try {
      // 获取当前画集中的所有作品
      const artworks = await db
        .select({
          id: comicUniverseArtworks.id,
          pageOrder: comicUniverseArtworks.pageOrder,
        })
        .from(comicUniverseArtworks)
        .where(and(
          eq(comicUniverseArtworks.collectionId, collectionId),
          eq(comicUniverseArtworks.isActive, true)
        ))
        .orderBy(asc(comicUniverseArtworks.pageOrder));

      // 找到要移动的作品
      const targetArtwork = artworks.find(a => a.id === artworkId);
      if (!targetArtwork) {
        throw new Error('作品不存在');
      }

      // 确保目标位置在有效范围内
      if (targetOrder < 0 || targetOrder >= artworks.length) {
        throw new Error('目标位置无效');
      }

      // 重新计算所有作品的显示顺序
      const sortedArtworks = artworks.filter(a => a.id !== artworkId);
      sortedArtworks.splice(targetOrder, 0, targetArtwork);

      // 生成新的显示顺序
      const updates = sortedArtworks.map((artwork, index) => ({
        id: artwork.id,
        pageOrder: index,
      }));

      await this.updateArtworkOrder(collectionId, updates);
    } catch (error) {
      console.error('移动作品失败:', error);
      throw error;
    }
  }

  // 上移作品
  async moveArtworkUp(collectionId: number, artworkId: number): Promise<void> {
    try {
      const artworks = await db
        .select({
          id: comicUniverseArtworks.id,
          pageOrder: comicUniverseArtworks.pageOrder,
        })
        .from(comicUniverseArtworks)
        .where(and(
          eq(comicUniverseArtworks.collectionId, collectionId),
          eq(comicUniverseArtworks.isActive, true)
        ))
        .orderBy(asc(comicUniverseArtworks.pageOrder), asc(comicUniverseArtworks.id)); // 添加id作为次要排序

      // 检查并修复重复的pageOrder
      const pageOrders = artworks.map(a => a.pageOrder);
      const hasDuplicates = pageOrders.length !== new Set(pageOrders).size;
      
      if (hasDuplicates || artworks.some(a => a.pageOrder === null)) {
        console.log('检测到重复pageOrder，先修复顺序...');
        
        // 重新分配连续的pageOrder
        const fixUpdates = artworks.map((artwork, index) => ({
          id: artwork.id,
          pageOrder: index,
        }));
        
        await this.updateArtworkOrder(collectionId, fixUpdates);
        
        // 重新获取修复后的数据
        const fixedArtworks = await db
          .select({
            id: comicUniverseArtworks.id,
            pageOrder: comicUniverseArtworks.pageOrder,
          })
          .from(comicUniverseArtworks)
          .where(and(
            eq(comicUniverseArtworks.collectionId, collectionId),
            eq(comicUniverseArtworks.isActive, true)
          ))
          .orderBy(asc(comicUniverseArtworks.pageOrder));
          
        // 使用修复后的数据继续操作
        artworks.splice(0, artworks.length, ...fixedArtworks);
      }

      const currentIndex = artworks.findIndex(a => a.id === artworkId);
      if (currentIndex === -1) {
        throw new Error('作品不存在');
      }
      if (currentIndex === 0) {
        throw new Error('作品已经在最前面');
      }

      // 交换当前作品和前一个作品的顺序
      const targetIndex = currentIndex - 1;
      const currentOrder = artworks[targetIndex].pageOrder;
      const targetOrder = artworks[currentIndex].pageOrder;
      
      const updates = [
        { id: artworks[currentIndex].id, pageOrder: currentOrder },
        { id: artworks[targetIndex].id, pageOrder: targetOrder }
      ];

      await this.updateArtworkOrder(collectionId, updates);
    } catch (error) {
      console.error('上移作品失败:', error);
      throw error;
    }
  }

  // 下移作品
  async moveArtworkDown(collectionId: number, artworkId: number): Promise<void> {
    try {
      const artworks = await db
        .select({
          id: comicUniverseArtworks.id,
          pageOrder: comicUniverseArtworks.pageOrder,
        })
        .from(comicUniverseArtworks)
        .where(and(
          eq(comicUniverseArtworks.collectionId, collectionId),
          eq(comicUniverseArtworks.isActive, true)
        ))
        .orderBy(asc(comicUniverseArtworks.pageOrder), asc(comicUniverseArtworks.id)); // 添加id作为次要排序

      // 检查并修复重复的pageOrder
      const pageOrders = artworks.map(a => a.pageOrder);
      const hasDuplicates = pageOrders.length !== new Set(pageOrders).size;
      
      if (hasDuplicates || artworks.some(a => a.pageOrder === null)) {
        console.log('检测到重复pageOrder，先修复顺序...');
        
        // 重新分配连续的pageOrder
        const fixUpdates = artworks.map((artwork, index) => ({
          id: artwork.id,
          pageOrder: index,
        }));
        
        await this.updateArtworkOrder(collectionId, fixUpdates);
        
        // 重新获取修复后的数据
        const fixedArtworks = await db
          .select({
            id: comicUniverseArtworks.id,
            pageOrder: comicUniverseArtworks.pageOrder,
          })
          .from(comicUniverseArtworks)
          .where(and(
            eq(comicUniverseArtworks.collectionId, collectionId),
            eq(comicUniverseArtworks.isActive, true)
          ))
          .orderBy(asc(comicUniverseArtworks.pageOrder));
          
        // 使用修复后的数据继续操作
        artworks.splice(0, artworks.length, ...fixedArtworks);
      }

      // 添加调试信息
      console.log('下移作品后端调试信息:', {
        collectionId,
        artworkId,
        totalArtworks: artworks.length,
        artworkOrders: artworks.map(a => ({ id: a.id, pageOrder: a.pageOrder }))
      });

      const currentIndex = artworks.findIndex(a => a.id === artworkId);
      if (currentIndex === -1) {
        throw new Error('作品不存在');
      }
      if (currentIndex === artworks.length - 1) {
        throw new Error('作品已经在最后面');
      }

      // 交换当前作品和后一个作品的顺序
      const targetIndex = currentIndex + 1;
      const currentOrder = artworks[targetIndex].pageOrder;
      const targetOrder = artworks[currentIndex].pageOrder;
      
      console.log('下移交换信息:', {
        currentIndex,
        targetIndex,
        currentOrder,
        targetOrder,
        currentArtworkId: artworks[currentIndex].id,
        targetArtworkId: artworks[targetIndex].id
      });
      
      const updates = [
        { id: artworks[currentIndex].id, pageOrder: currentOrder },
        { id: artworks[targetIndex].id, pageOrder: targetOrder }
      ];

      await this.updateArtworkOrder(collectionId, updates);
    } catch (error) {
      console.error('下移作品失败:', error);
      throw error;
    }
  }

  // 获取指定画集的所有作品（按顺序）
  async getArtworksByCollection(collectionId: number): Promise<(ArtworkPage & { pageOrder: number })[]> {
    try {
      const artworks = await db
        .select({
          id: comicUniverseArtworks.id,
          title: comicUniverseArtworks.title,
          number: comicUniverseArtworks.number,
          fileId: comicUniverseArtworks.fileId, // 只查询fileId，不查询Base64图片
          description: comicUniverseArtworks.description,
          createdTime: comicUniverseArtworks.createdTime,
          theme: comicUniverseArtworks.theme,
          pageOrder: comicUniverseArtworks.pageOrder,
        })
        .from(comicUniverseArtworks)
        .where(and(
          eq(comicUniverseArtworks.collectionId, collectionId),
          eq(comicUniverseArtworks.isActive, true)
        ))
        .orderBy(asc(comicUniverseArtworks.pageOrder), asc(comicUniverseArtworks.id)); // 添加id作为次要排序

      // 检查是否有重复的pageOrder，如果有则修复
      const pageOrders = artworks.map(a => a.pageOrder);
      const hasDuplicates = pageOrders.length !== new Set(pageOrders).size;
      
      if (hasDuplicates || artworks.some(a => a.pageOrder === null)) {
        console.log('检测到重复或空的pageOrder，开始修复...');
        
        // 重新分配连续的pageOrder
        const updates = artworks.map((artwork, index) => ({
          id: artwork.id,
          pageOrder: index,
        }));
        
        await this.updateArtworkOrder(collectionId, updates);
        
        // 重新查询修复后的数据
        const fixedArtworks = await db
          .select({
            id: comicUniverseArtworks.id,
            title: comicUniverseArtworks.title,
            number: comicUniverseArtworks.number,
            fileId: comicUniverseArtworks.fileId, // 只查询fileId，不查询Base64图片
            description: comicUniverseArtworks.description,
            createdTime: comicUniverseArtworks.createdTime,
            theme: comicUniverseArtworks.theme,
            pageOrder: comicUniverseArtworks.pageOrder,
          })
          .from(comicUniverseArtworks)
          .where(and(
            eq(comicUniverseArtworks.collectionId, collectionId),
            eq(comicUniverseArtworks.isActive, true)
          ))
          .orderBy(asc(comicUniverseArtworks.pageOrder));
          
        return await this.buildArtworkPagesWithUrls(fixedArtworks, collectionId);
      }

      return await this.buildArtworkPagesWithUrls(artworks, collectionId);
    } catch (error) {
      console.error('获取作品列表失败:', error);
      throw error;
    }
  }

  // 构建作品页面数据，包含正确的图片URL
  private async buildArtworkPagesWithUrls(artworks: any[], collectionId: number): Promise<(ArtworkPage & { pageOrder: number })[]> {
    // 批量获取文件URL以提高性能
    const fileIdToUrlMap = new Map<string, string>();
    const artworksWithFileId = artworks.filter(artwork => artwork.fileId);
    
    if (artworksWithFileId.length > 0) {
      try {
        // 使用ShowMasterpiece的独立文件服务配置
        const { getShowMasterpieceFileConfig } = await import('../services/fileService');
        const configManager = await getShowMasterpieceFileConfig();
        const { UniversalFileService } = await import('../../../universalFile/server/UniversalFileService');
        
        const fileService = new UniversalFileService(configManager.getConfig());
        await fileService.initialize();
        
        // 并行获取所有文件URL
        const urlPromises = artworksWithFileId.map(async (artwork) => {
          try {
            const fileUrl = await fileService.getFileUrl(artwork.fileId);
            return { fileId: artwork.fileId, url: fileUrl };
          } catch (error) {
            console.warn(`⚠️ [ArtworksDbService] 获取文件URL失败: ${artwork.fileId}`, error);
            return { fileId: artwork.fileId, url: null };
          }
        });
        
        const urlResults = await Promise.all(urlPromises);
        urlResults.forEach(result => {
          if (result.url) {
            fileIdToUrlMap.set(result.fileId, result.url);
          }
        });
      } catch (error) {
        console.warn('⚠️ [ArtworksDbService] 批量获取文件URL失败:', error);
      }
    }
    
    return artworks.map(artwork => {
      // 构建图片URL，优先使用OSS URL，回退到API路径
      let imageUrl: string;
      if (artwork.fileId && fileIdToUrlMap.has(artwork.fileId)) {
        imageUrl = fileIdToUrlMap.get(artwork.fileId)!;
      } else {
        // 如果没有fileId或获取URL失败，使用API路径
        imageUrl = `/api/showmasterpiece/collections/${collectionId}/artworks/${artwork.id}/image`;
      }
      
      return {
        id: artwork.id,
        title: artwork.title,
        number: artwork.number,
        image: imageUrl, // 使用OSS URL或API路径
        fileId: artwork.fileId || undefined,
        description: artwork.description || '',
        createdTime: artwork.createdTime || '',
        theme: artwork.theme || '',
        pageOrder: artwork.pageOrder,
      };
    });
  }
}

// 导出服务实例
export const masterpiecesConfigDbService = new MasterpiecesConfigDbService();
export const categoriesDbService = new CategoriesDbService();
export const tagsDbService = new TagsDbService();
export const collectionsDbService = new CollectionsDbService();
export const artworksDbService = new ArtworksDbService(collectionsDbService); 
