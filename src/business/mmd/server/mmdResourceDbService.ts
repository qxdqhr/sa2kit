import { eq, desc, and, like, or } from 'drizzle-orm';
import {
  mmdModels,
  mmdAnimations,
  mmdAudios,
  mmdScenes,
} from './resource-schema';
import type { MMDModel, MMDAnimation, MMDAudio, MMDScene } from './resource-types';

export type MmdResourceDrizzleDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
};

export class MMDModelsDbService {
  constructor(private readonly db: MmdResourceDrizzleDb) {}

  async getPublicModels(): Promise<MMDModel[]> {
    const result = await this.db
      .select()
      .from(mmdModels)
      .where(eq(mmdModels.isPublic, true))
      .orderBy(desc(mmdModels.uploadTime));
    return result.map(this.formatModel);
  }

  async getUserModels(userId: string): Promise<MMDModel[]> {
    const result = await this.db
      .select()
      .from(mmdModels)
      .where(eq(mmdModels.userId, userId))
      .orderBy(desc(mmdModels.uploadTime));
    return result.map(this.formatModel);
  }

  async getModelById(id: number): Promise<MMDModel | null> {
    const result = await this.db
      .select()
      .from(mmdModels)
      .where(eq(mmdModels.id, id))
      .limit(1);
    if (result.length === 0) return null;
    return this.formatModel(result[0]);
  }

  async searchModels(query: string, userId?: string): Promise<MMDModel[]> {
    const conditions = [
      like(mmdModels.name, `%${query}%`),
      like(mmdModels.description, `%${query}%`),
    ];

    const whereCondition = userId
      ? and(
          or(...conditions),
          or(eq(mmdModels.isPublic, true), eq(mmdModels.userId, userId)),
        )
      : and(or(...conditions), eq(mmdModels.isPublic, true));

    const result = await this.db
      .select()
      .from(mmdModels)
      .where(whereCondition)
      .orderBy(desc(mmdModels.uploadTime));
    return result.map(this.formatModel);
  }

  async createModel(data: {
    name: string;
    description?: string;
    filePath: string;
    thumbnailPath?: string;
    fileSize: number;
    format: 'pmd' | 'pmx';
    userId?: string;
    tags?: string[];
    isPublic: boolean;
  }): Promise<MMDModel> {
    const result = await this.db
      .insert(mmdModels)
      .values({
        ...data,
        downloadCount: 0,
      })
      .returning();
    return this.formatModel(result[0]);
  }

  async updateModel(
    id: number,
    data: Partial<Omit<MMDModel, 'id' | 'uploadTime'>>,
  ): Promise<MMDModel | null> {
    const updateData: Record<string, unknown> = { ...data };
    delete updateData.id;
    delete updateData.uploadTime;
    if (updateData.userId) {
      updateData.userId = String(updateData.userId);
    }

    const result = await this.db
      .update(mmdModels)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(mmdModels.id, id))
      .returning();

    if (result.length === 0) return null;
    return this.formatModel(result[0]);
  }

  async deleteModel(id: number): Promise<boolean> {
    const result = await this.db
      .delete(mmdModels)
      .where(eq(mmdModels.id, id))
      .returning();
    return result.length > 0;
  }

  async incrementDownloadCount(id: number): Promise<void> {
    const model = await this.getModelById(id);
    if (!model) return;
    await this.db
      .update(mmdModels)
      .set({
        downloadCount: (Number(model.downloadCount) || 0) + 1,
      })
      .where(eq(mmdModels.id, id));
  }

  private formatModel(row: any): MMDModel {
    return {
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      filePath: row.filePath,
      thumbnailPath: row.thumbnailPath,
      fileSize: row.fileSize,
      uploadTime: row.uploadTime,
      format: row.format,
      userId: row.userId?.toString(),
      tags: row.tags || [],
      isPublic: row.isPublic,
      downloadCount: row.downloadCount,
    };
  }
}

export class MMDAnimationsDbService {
  constructor(private readonly db: MmdResourceDrizzleDb) {}

  async getPublicAnimations(): Promise<MMDAnimation[]> {
    const result = await this.db
      .select()
      .from(mmdAnimations)
      .where(eq(mmdAnimations.isPublic, true))
      .orderBy(desc(mmdAnimations.uploadTime));
    return result.map(this.formatAnimation);
  }

  async getUserAnimations(userId: string): Promise<MMDAnimation[]> {
    const result = await this.db
      .select()
      .from(mmdAnimations)
      .where(eq(mmdAnimations.userId, userId))
      .orderBy(desc(mmdAnimations.uploadTime));
    return result.map(this.formatAnimation);
  }

  async getAnimationById(id: number): Promise<MMDAnimation | null> {
    const result = await this.db
      .select()
      .from(mmdAnimations)
      .where(eq(mmdAnimations.id, id))
      .limit(1);
    if (result.length === 0) return null;
    return this.formatAnimation(result[0]);
  }

  async createAnimation(data: {
    name: string;
    description?: string;
    filePath: string;
    fileSize: number;
    duration: number;
    frameCount: number;
    userId?: string;
    tags?: string[];
    isPublic: boolean;
    compatibleModels?: string[];
  }): Promise<MMDAnimation> {
    const result = await this.db.insert(mmdAnimations).values(data).returning();
    return this.formatAnimation(result[0]);
  }

  async updateAnimation(
    id: number,
    data: Partial<Omit<MMDAnimation, 'id' | 'uploadTime'>>,
  ): Promise<MMDAnimation | null> {
    const updateData: Record<string, unknown> = { ...data };
    delete updateData.id;
    delete updateData.uploadTime;
    if (updateData.userId) {
      updateData.userId = String(updateData.userId);
    }

    const result = await this.db
      .update(mmdAnimations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(mmdAnimations.id, id))
      .returning();

    if (result.length === 0) return null;
    return this.formatAnimation(result[0]);
  }

  async deleteAnimation(id: number): Promise<boolean> {
    const result = await this.db
      .delete(mmdAnimations)
      .where(eq(mmdAnimations.id, id))
      .returning();
    return result.length > 0;
  }

  private formatAnimation(row: any): MMDAnimation {
    return {
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      filePath: row.filePath,
      fileSize: row.fileSize,
      uploadTime: row.uploadTime,
      duration: row.duration,
      frameCount: row.frameCount,
      userId: row.userId?.toString(),
      tags: row.tags || [],
      isPublic: row.isPublic,
      compatibleModels: row.compatibleModels || [],
    };
  }
}

export class MMDAudiosDbService {
  constructor(private readonly db: MmdResourceDrizzleDb) {}

  async getUserAudios(userId: string): Promise<MMDAudio[]> {
    const result = await this.db
      .select()
      .from(mmdAudios)
      .where(eq(mmdAudios.userId, userId))
      .orderBy(desc(mmdAudios.uploadTime));
    return result.map(this.formatAudio);
  }

  async getAudioById(id: number): Promise<MMDAudio | null> {
    const result = await this.db
      .select()
      .from(mmdAudios)
      .where(eq(mmdAudios.id, id))
      .limit(1);
    if (result.length === 0) return null;
    return this.formatAudio(result[0]);
  }

  async createAudio(data: {
    name: string;
    filePath: string;
    fileSize: number;
    duration: number;
    format: 'wav' | 'mp3' | 'ogg';
    userId?: string;
  }): Promise<MMDAudio> {
    const result = await this.db.insert(mmdAudios).values(data).returning();
    return this.formatAudio(result[0]);
  }

  async deleteAudio(id: number): Promise<boolean> {
    const result = await this.db
      .delete(mmdAudios)
      .where(eq(mmdAudios.id, id))
      .returning();
    return result.length > 0;
  }

  private formatAudio(row: any): MMDAudio {
    return {
      id: row.id.toString(),
      name: row.name,
      filePath: row.filePath,
      fileSize: row.fileSize,
      uploadTime: row.uploadTime,
      duration: row.duration,
      format: row.format,
      userId: row.userId?.toString(),
    };
  }
}

export class MMDScenesDbService {
  constructor(private readonly db: MmdResourceDrizzleDb) {}

  async getUserScenes(userId: string): Promise<MMDScene[]> {
    const result = await this.db
      .select()
      .from(mmdScenes)
      .where(eq(mmdScenes.userId, userId))
      .orderBy(desc(mmdScenes.createdAt));
    return result.map(this.formatScene);
  }

  async getSceneById(id: number): Promise<MMDScene | null> {
    const result = await this.db
      .select()
      .from(mmdScenes)
      .where(eq(mmdScenes.id, id))
      .limit(1);
    if (result.length === 0) return null;
    return this.formatScene(result[0]);
  }

  async createScene(data: {
    name: string;
    description?: string;
    modelId: number;
    animationId?: number;
    audioId?: number;
    cameraPosition: { x: number; y: number; z: number };
    cameraTarget: { x: number; y: number; z: number };
    lighting: MMDScene['lighting'];
    background: MMDScene['background'];
    userId?: string;
  }): Promise<MMDScene> {
    const result = await this.db.insert(mmdScenes).values(data).returning();
    return this.formatScene(result[0]);
  }

  async updateScene(
    id: number,
    data: Partial<Omit<MMDScene, 'id' | 'createdAt'>>,
  ): Promise<MMDScene | null> {
    const updateData: Record<string, unknown> = { ...data };
    delete updateData.id;
    delete updateData.createdAt;
    if (updateData.userId) {
      updateData.userId = String(updateData.userId);
    }
    if (updateData.modelId) {
      updateData.modelId = parseInt(String(updateData.modelId), 10);
    }
    if (updateData.animationId) {
      updateData.animationId = parseInt(String(updateData.animationId), 10);
    }
    if (updateData.audioId) {
      updateData.audioId = parseInt(String(updateData.audioId), 10);
    }

    const result = await this.db
      .update(mmdScenes)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(mmdScenes.id, id))
      .returning();

    if (result.length === 0) return null;
    return this.formatScene(result[0]);
  }

  async deleteScene(id: number): Promise<boolean> {
    const result = await this.db
      .delete(mmdScenes)
      .where(eq(mmdScenes.id, id))
      .returning();
    return result.length > 0;
  }

  private formatScene(row: any): MMDScene {
    return {
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      modelId: row.modelId.toString(),
      animationId: row.animationId?.toString(),
      audioId: row.audioId?.toString(),
      cameraPosition: row.cameraPosition,
      cameraTarget: row.cameraTarget,
      lighting: row.lighting,
      background: row.background,
      userId: row.userId?.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export function createMMDModelsDbService(db: MmdResourceDrizzleDb) {
  return new MMDModelsDbService(db);
}

export function createMMDAnimationsDbService(db: MmdResourceDrizzleDb) {
  return new MMDAnimationsDbService(db);
}

export function createMMDAudiosDbService(db: MmdResourceDrizzleDb) {
  return new MMDAudiosDbService(db);
}

export function createMMDScenesDbService(db: MmdResourceDrizzleDb) {
  return new MMDScenesDbService(db);
}
