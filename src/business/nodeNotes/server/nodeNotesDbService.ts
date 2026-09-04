import { and, desc, eq, sql } from 'drizzle-orm';
import {
  nodeNoteDocuments,
  nodeNoteEdges,
  nodeNoteNodes,
} from './schema';
import type {
  DocumentFormData,
  DocumentGraph,
  DocumentListItem,
  EdgeFormData,
  NodeFormData,
  NodeLinks,
  NodeNoteDocument,
  NodeNoteEdge,
  NodeNoteNode,
  ViewportState,
} from '../domain/types';
import { slugifyTitle, uniqueSlug } from '../domain/slug';
import {
  DEFAULT_CANVAS_BG,
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_BG,
  DEFAULT_NODE_TEXT,
  normalizeHexColor,
} from '../domain/nodeStyle';
import { parseViewport, serializeViewport } from '../domain/viewport';

export type NodeNotesDrizzleDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
  transaction: <T>(fn: (tx: any) => Promise<T>) => Promise<T>;
};

export class NodeNotesDbService {
  constructor(private readonly db: NodeNotesDrizzleDb) {}
  async getUserDocuments(userId: string): Promise<DocumentListItem[]> {
    const rows = await this.db
      .select({
        id: nodeNoteDocuments.id,
        userId: nodeNoteDocuments.userId,
        title: nodeNoteDocuments.title,
        description: nodeNoteDocuments.description,
        slug: nodeNoteDocuments.slug,
        viewport: nodeNoteDocuments.viewport,
        canvasBgColor: nodeNoteDocuments.canvasBgColor,
        createdAt: nodeNoteDocuments.createdAt,
        updatedAt: nodeNoteDocuments.updatedAt,
        nodeCount: sql<number>`cast(count(distinct ${nodeNoteNodes.id}) as int)`,
        edgeCount: sql<number>`cast(count(distinct ${nodeNoteEdges.id}) as int)`,
      })
      .from(nodeNoteDocuments)
      .leftJoin(nodeNoteNodes, eq(nodeNoteNodes.documentId, nodeNoteDocuments.id))
      .leftJoin(nodeNoteEdges, eq(nodeNoteEdges.documentId, nodeNoteDocuments.id))
      .where(eq(nodeNoteDocuments.userId, userId))
      .groupBy(nodeNoteDocuments.id)
      .orderBy(desc(nodeNoteDocuments.updatedAt));

    return rows.map((r) => ({
      ...r,
      nodeCount: r.nodeCount ?? 0,
      edgeCount: r.edgeCount ?? 0,
    }));
  }

  async getDocumentById(documentId: string, userId: string): Promise<NodeNoteDocument | null> {
    const [row] = await this.db
      .select()
      .from(nodeNoteDocuments)
      .where(and(eq(nodeNoteDocuments.id, documentId), eq(nodeNoteDocuments.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  async createDocument(userId: string, data: DocumentFormData): Promise<NodeNoteDocument> {
    const existing = await this.db
      .select({ slug: nodeNoteDocuments.slug })
      .from(nodeNoteDocuments)
      .where(eq(nodeNoteDocuments.userId, userId));
    const slugSet = new Set(existing.map((e) => e.slug));
    const slug = uniqueSlug(slugifyTitle(data.title), slugSet);

    const [row] = await this.db
      .insert(nodeNoteDocuments)
      .values({
        userId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        slug,
        updatedAt: new Date(),
      })
      .returning();

    return row;
  }

  async updateDocument(
    documentId: string,
    userId: string,
    data: Partial<DocumentFormData> & { viewport?: ViewportState | null },
  ): Promise<NodeNoteDocument | null> {
    const doc = await this.getDocumentById(documentId, userId);
    if (!doc) return null;

    const patch: Partial<typeof nodeNoteDocuments.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) {
      patch.title = data.title.trim();
      const existing = await this.db
        .select({ slug: nodeNoteDocuments.slug })
        .from(nodeNoteDocuments)
        .where(eq(nodeNoteDocuments.userId, userId));
      const slugSet = new Set(existing.map((e) => e.slug));
      slugSet.delete(doc.slug);
      patch.slug = uniqueSlug(slugifyTitle(data.title), slugSet);
    }
    if (data.description !== undefined) patch.description = data.description?.trim() || null;
    if (data.viewport !== undefined) patch.viewport = serializeViewport(data.viewport);
    if (data.canvasBgColor !== undefined) {
      patch.canvasBgColor = normalizeHexColor(data.canvasBgColor, DEFAULT_CANVAS_BG);
    }

    const [row] = await this.db
      .update(nodeNoteDocuments)
      .set(patch)
      .where(eq(nodeNoteDocuments.id, documentId))
      .returning();

    return row ?? null;
  }

  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(nodeNoteDocuments)
      .where(and(eq(nodeNoteDocuments.id, documentId), eq(nodeNoteDocuments.userId, userId)))
      .returning({ id: nodeNoteDocuments.id });
    return result.length > 0;
  }

  async getDocumentGraph(documentId: string, userId: string): Promise<DocumentGraph | null> {
    const document = await this.getDocumentById(documentId, userId);
    if (!document) return null;

    const nodes = await this.db
      .select()
      .from(nodeNoteNodes)
      .where(eq(nodeNoteNodes.documentId, documentId));

    const edges = await this.db
      .select()
      .from(nodeNoteEdges)
      .where(eq(nodeNoteEdges.documentId, documentId));

    return { document, nodes, edges };
  }

  async createNode(
    documentId: string,
    userId: string,
    data: NodeFormData,
  ): Promise<NodeNoteNode | null> {
    const doc = await this.getDocumentById(documentId, userId);
    if (!doc) return null;

    const [row] = await this.db
      .insert(nodeNoteNodes)
      .values({
        documentId,
        title: data.title.trim().slice(0, 200),
        contentMd: data.contentMd ?? '',
        positionX: data.positionX ?? 0,
        positionY: data.positionY ?? 0,
        width: data.width ?? 280,
        height: data.height ?? 160,
        bgColor: normalizeHexColor(data.bgColor, DEFAULT_NODE_BG),
        textColor: normalizeHexColor(data.textColor, DEFAULT_NODE_TEXT),
        updatedAt: new Date(),
      })
      .returning();

    await this.db
      .update(nodeNoteDocuments)
      .set({ updatedAt: new Date() })
      .where(eq(nodeNoteDocuments.id, documentId));

    return row;
  }

  async updateNode(
    nodeId: string,
    userId: string,
    data: Partial<NodeFormData>,
  ): Promise<NodeNoteNode | null> {
    const owned = await this.getOwnedNode(nodeId, userId);
    if (!owned) return null;

    const patch: Partial<typeof nodeNoteNodes.$inferInsert> = { updatedAt: new Date() };
    if (data.title !== undefined) patch.title = data.title.trim().slice(0, 200);
    if (data.contentMd !== undefined) patch.contentMd = data.contentMd.slice(0, 32768);
    if (data.positionX !== undefined) patch.positionX = data.positionX;
    if (data.positionY !== undefined) patch.positionY = data.positionY;
    if (data.width !== undefined) patch.width = data.width;
    if (data.height !== undefined) patch.height = data.height;
    if (data.bgColor !== undefined) patch.bgColor = normalizeHexColor(data.bgColor, DEFAULT_NODE_BG);
    if (data.textColor !== undefined) {
      patch.textColor = normalizeHexColor(data.textColor, DEFAULT_NODE_TEXT);
    }

    const [row] = await this.db
      .update(nodeNoteNodes)
      .set(patch)
      .where(eq(nodeNoteNodes.id, nodeId))
      .returning();

    await this.db
      .update(nodeNoteDocuments)
      .set({ updatedAt: new Date() })
      .where(eq(nodeNoteDocuments.id, owned.documentId));

    return row ?? null;
  }

  async deleteNode(nodeId: string, userId: string): Promise<boolean> {
    const owned = await this.getOwnedNode(nodeId, userId);
    if (!owned) return false;

    const result = await this.db
      .delete(nodeNoteNodes)
      .where(eq(nodeNoteNodes.id, nodeId))
      .returning({ id: nodeNoteNodes.id });

    if (result.length > 0) {
      await this.db
        .update(nodeNoteDocuments)
        .set({ updatedAt: new Date() })
        .where(eq(nodeNoteDocuments.id, owned.documentId));
    }

    return result.length > 0;
  }

  async createEdge(
    documentId: string,
    userId: string,
    data: EdgeFormData,
  ): Promise<NodeNoteEdge | null> {
    const doc = await this.getDocumentById(documentId, userId);
    if (!doc) return null;
    if (data.sourceId === data.targetId) return null;

    const nodes = await this.db
      .select({ id: nodeNoteNodes.id })
      .from(nodeNoteNodes)
      .where(eq(nodeNoteNodes.documentId, documentId));
    const nodeIds = new Set(nodes.map((n) => n.id));
    if (!nodeIds.has(data.sourceId) || !nodeIds.has(data.targetId)) return null;

    try {
      const [row] = await this.db
        .insert(nodeNoteEdges)
        .values({
          documentId,
          sourceId: data.sourceId,
          targetId: data.targetId,
          label: data.label?.trim().slice(0, 50) || null,
          color: normalizeHexColor(data.color, DEFAULT_EDGE_COLOR),
        })
        .returning();

      await this.db
        .update(nodeNoteDocuments)
        .set({ updatedAt: new Date() })
        .where(eq(nodeNoteDocuments.id, documentId));

      return row;
    } catch {
      return null;
    }
  }

  async updateEdge(
    edgeId: string,
    userId: string,
    data: { label?: string | null; color?: string },
  ): Promise<NodeNoteEdge | null> {
    const owned = await this.getOwnedEdge(edgeId, userId);
    if (!owned) return null;

    const patch: Partial<typeof nodeNoteEdges.$inferInsert> = {};
    if (data.label !== undefined) patch.label = data.label?.trim().slice(0, 50) || null;
    if (data.color !== undefined) patch.color = normalizeHexColor(data.color, DEFAULT_EDGE_COLOR);

    const [row] = await this.db
      .update(nodeNoteEdges)
      .set(patch)
      .where(eq(nodeNoteEdges.id, edgeId))
      .returning();

    return row ?? null;
  }

  async deleteEdge(edgeId: string, userId: string): Promise<boolean> {
    const owned = await this.getOwnedEdge(edgeId, userId);
    if (!owned) return false;

    const result = await this.db
      .delete(nodeNoteEdges)
      .where(eq(nodeNoteEdges.id, edgeId))
      .returning({ id: nodeNoteEdges.id });

    if (result.length > 0) {
      await this.db
        .update(nodeNoteDocuments)
        .set({ updatedAt: new Date() })
        .where(eq(nodeNoteDocuments.id, owned.documentId));
    }

    return result.length > 0;
  }

  async getNodeLinks(nodeId: string, userId: string): Promise<NodeLinks | null> {
    const owned = await this.getOwnedNode(nodeId, userId);
    if (!owned) return null;

    const incomingRows = await this.db
      .select({
        edgeId: nodeNoteEdges.id,
        nodeId: nodeNoteNodes.id,
        title: nodeNoteNodes.title,
        label: nodeNoteEdges.label,
      })
      .from(nodeNoteEdges)
      .innerJoin(nodeNoteNodes, eq(nodeNoteEdges.sourceId, nodeNoteNodes.id))
      .where(eq(nodeNoteEdges.targetId, nodeId));

    const outgoingRows = await this.db
      .select({
        edgeId: nodeNoteEdges.id,
        nodeId: nodeNoteNodes.id,
        title: nodeNoteNodes.title,
        label: nodeNoteEdges.label,
      })
      .from(nodeNoteEdges)
      .innerJoin(nodeNoteNodes, eq(nodeNoteEdges.targetId, nodeNoteNodes.id))
      .where(eq(nodeNoteEdges.sourceId, nodeId));

    return {
      incoming: incomingRows,
      outgoing: outgoingRows,
    };
  }

  async getOwnedNode(nodeId: string, userId: string) {
    const [row] = await this.db
      .select({
        nodeId: nodeNoteNodes.id,
        documentId: nodeNoteNodes.documentId,
      })
      .from(nodeNoteNodes)
      .innerJoin(nodeNoteDocuments, eq(nodeNoteNodes.documentId, nodeNoteDocuments.id))
      .where(and(eq(nodeNoteNodes.id, nodeId), eq(nodeNoteDocuments.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  async getOwnedEdge(edgeId: string, userId: string) {
    const [row] = await this.db
      .select({
        edgeId: nodeNoteEdges.id,
        documentId: nodeNoteEdges.documentId,
      })
      .from(nodeNoteEdges)
      .innerJoin(nodeNoteDocuments, eq(nodeNoteEdges.documentId, nodeNoteDocuments.id))
      .where(and(eq(nodeNoteEdges.id, edgeId), eq(nodeNoteDocuments.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  getParsedViewport(document: NodeNoteDocument): ViewportState | null {
    return parseViewport(document.viewport);
  }
}

export function createNodeNotesDbService(db: NodeNotesDrizzleDb) {
  return new NodeNotesDbService(db);
}
