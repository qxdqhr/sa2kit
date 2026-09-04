/**
 * nodeNotes 路由工厂（Phase G7）
 * 用 Web Request + Response.json，避免 sa2kit peer next 与宿主 NextRequest 双版本冲突。
 */
import {
  createNodeNotesDbService,
  type NodeNotesDrizzleDb,
} from '../server';
import { buildDocumentZip } from '../domain/exportDocumentZip';
import {
  importMarkdownFiles,
  importZipPackage,
  isZipBuffer,
} from '../domain/importDocument';
import type {
  DocumentFormData,
  EdgeFormData,
  ImportMode,
  NodeFormData,
  ViewportState,
} from '../domain/types';

export type NodeNotesSessionUser = { id: string };

export type NodeNotesRouteConfig = {
  db: NodeNotesDrizzleDb;
  getSessionUser: (request: Request) => Promise<NodeNotesSessionUser | null>;
};

type IdRouteContext = { params: Promise<{ id: string }> };

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function ok<T>(data: T) {
  return json({ success: true, data });
}

function fail(message: string, status = 500) {
  return json({ success: false, message }, status);
}

function unauthorized() {
  return fail('未授权访问', 401);
}

function createService(config: NodeNotesRouteConfig) {
  return createNodeNotesDbService(config.db);
}

async function requireUser(config: NodeNotesRouteConfig, request: Request) {
  const user = await config.getSessionUser(request);
  if (!user) return { user: null as null, response: unauthorized() };
  return { user, response: null as null };
}

export function createListDocumentsHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;
    const documents = await service.getUserDocuments(String(user!.id));
    return ok(documents);
  };
}

export function createCreateDocumentHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const body = (await request.json()) as DocumentFormData;
    if (!body.title?.trim()) return fail('文档标题不能为空', 400);
    if (body.title.trim().length > 100) return fail('文档标题不能超过 100 字', 400);

    const doc = await service.createDocument(String(user!.id), body);
    return ok(doc);
  };
}

export function createGetDocumentHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const graph = await service.getDocumentGraph(id, String(user!.id));
    if (!graph) return fail('文档不存在', 404);
    return ok(graph);
  };
}

export function createUpdateDocumentHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const body = (await request.json()) as DocumentFormData & { viewport?: ViewportState | null };

    if (body.title !== undefined && !body.title.trim()) return fail('文档标题不能为空', 400);

    const doc = await service.updateDocument(id, String(user!.id), body);
    if (!doc) return fail('文档不存在', 404);
    return ok(doc);
  };
}

export function createDeleteDocumentHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const deleted = await service.deleteDocument(id, String(user!.id));
    if (!deleted) return fail('文档不存在', 404);
    return ok({ deleted: true });
  };
}

export function createCreateNodeHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const body = (await request.json()) as NodeFormData;
    if (!body.title?.trim()) return fail('节点标题不能为空', 400);

    const node = await service.createNode(id, String(user!.id), body);
    if (!node) return fail('文档不存在', 404);
    return ok(node);
  };
}

export function createCreateEdgeHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const body = (await request.json()) as EdgeFormData;

    if (!body.sourceId || !body.targetId) return fail('sourceId 与 targetId 必填', 400);
    if (body.sourceId === body.targetId) return fail('不能创建自环有向边', 400);

    const edge = await service.createEdge(id, String(user!.id), body);
    if (!edge) return fail('无法创建边（文档不存在、节点无效或边已存在）', 400);
    return ok(edge);
  };
}

export function createExportDocumentHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const graph = await service.getDocumentGraph(id, String(user!.id));
    if (!graph) return fail('文档不存在', 404);

    const zipBuffer = buildDocumentZip(graph);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    const filename = `${graph.document.slug}-${stamp}.zip`;

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  };
}

export function createImportDocumentHandler(config: NodeNotesRouteConfig) {
  return async (request: Request) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const formData = await request.formData();
    const mode = (formData.get('mode') as ImportMode) || 'new-document';
    const targetDocumentId = (formData.get('targetDocumentId') as string) || undefined;
    const userId = String(user!.id);

    const fileEntries = formData.getAll('files');
    const buffers: Array<{ name: string; buffer: Buffer }> = [];

    for (const entry of fileEntries) {
      if (!(entry instanceof File)) continue;
      const buffer = Buffer.from(await entry.arrayBuffer());
      buffers.push({ name: entry.name, buffer });
    }

    if (buffers.length === 0) {
      const single = formData.get('file');
      if (single instanceof File) {
        buffers.push({
          name: single.name,
          buffer: Buffer.from(await single.arrayBuffer()),
        });
      }
    }

    if (buffers.length === 0) return fail('请上传文件', 400);

    try {
      if (buffers.length === 1 && isZipBuffer(buffers[0].buffer)) {
        const result = await importZipPackage(
          config.db,
          userId,
          buffers[0].buffer,
          mode,
          targetDocumentId,
        );
        return ok(result);
      }

      if (mode !== 'merge' || !targetDocumentId) {
        return fail('多个 Markdown 文件导入需要指定目标文档（merge 模式）', 400);
      }

      const nodesCreated = await importMarkdownFiles(
        config.db,
        userId,
        targetDocumentId,
        buffers,
      );
      return ok({ documentId: targetDocumentId, nodesCreated, edgesCreated: 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : '导入失败';
      return fail(message, 400);
    }
  };
}

export function createUpdateNodeHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const body = (await request.json()) as Partial<NodeFormData>;

    const node = await service.updateNode(id, String(user!.id), body);
    if (!node) return fail('节点不存在', 404);
    return ok(node);
  };
}

export function createDeleteNodeHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const deleted = await service.deleteNode(id, String(user!.id));
    if (!deleted) return fail('节点不存在', 404);
    return ok({ deleted: true });
  };
}

export function createGetNodeLinksHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const links = await service.getNodeLinks(id, String(user!.id));
    if (!links) return fail('节点不存在', 404);
    return ok(links);
  };
}

export function createUpdateEdgeHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const body = (await request.json()) as { label?: string | null; color?: string };

    const edge = await service.updateEdge(id, String(user!.id), body);
    if (!edge) return fail('边不存在', 404);
    return ok(edge);
  };
}

export function createDeleteEdgeHandler(config: NodeNotesRouteConfig) {
  const service = createService(config);
  return async (request: Request, context: IdRouteContext) => {
    const { user, response } = await requireUser(config, request);
    if (response) return response;

    const { id } = await context.params;
    const deleted = await service.deleteEdge(id, String(user!.id));
    if (!deleted) return fail('边不存在', 404);
    return ok({ deleted: true });
  };
}
