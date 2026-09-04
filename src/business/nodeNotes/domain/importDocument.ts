import AdmZip from 'adm-zip';
import { eq } from 'drizzle-orm';
import { nodeNoteDocuments, nodeNoteEdges, nodeNoteNodes } from '../server/schema';
import type { NodeNotesDrizzleDb } from '../server/nodeNotesDbService'; // type-only，避免 runtime 环
import type { ImportMode } from './types';
import { parseMarkdownFile } from './parseMarkdownFile';
import { isSafeZipPath, parseManifestFromZip } from './exportDocumentZip';
import { slugifyTitle, uniqueSlug } from './slug';
import {
  DEFAULT_NODE_BG,
  DEFAULT_NODE_TEXT,
  normalizeHexColor,
} from './nodeStyle';

const MAX_ZIP_BYTES = 20 * 1024 * 1024;
const MAX_MD_FILES = 50;

function gridPosition(index: number): { x: number; y: number } {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return { x: 80 + col * 320, y: 80 + row * 200 };
}

export async function importZipPackage(
  db: NodeNotesDrizzleDb,
  userId: string,
  buffer: Buffer,
  mode: ImportMode,
  targetDocumentId?: string,
): Promise<{ documentId: string; nodesCreated: number; edgesCreated: number }> {
  if (buffer.length > MAX_ZIP_BYTES) {
    throw new Error('ZIP 文件超过 20MB 限制');
  }

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  if (entries.length > 500) {
    throw new Error('ZIP 内文件过多');
  }

  for (const entry of entries) {
    if (!isSafeZipPath(entry.entryName)) {
      throw new Error('ZIP 包含非法路径');
    }
  }

  const manifest = parseManifestFromZip(zip);
  if (!manifest) {
    throw new Error('无效的 node-notes 格式包（缺少 manifest.json）');
  }

  return db.transaction(async (tx) => {
    let documentId: string;

    if (mode === 'merge') {
      if (!targetDocumentId) throw new Error('合并模式需要目标文档 ID');
      const [doc] = await tx
        .select()
        .from(nodeNoteDocuments)
        .where(eq(nodeNoteDocuments.id, targetDocumentId))
        .limit(1);
      if (!doc || doc.userId !== userId) throw new Error('目标文档不存在');
      documentId = doc.id;
    } else {
      const existing = await tx
        .select({ slug: nodeNoteDocuments.slug })
        .from(nodeNoteDocuments)
        .where(eq(nodeNoteDocuments.userId, userId));
      const slugSet = new Set(existing.map((e: { slug: string }) => e.slug));
      const title = manifest.document.title || '导入的文档';
      const slug = uniqueSlug(slugifyTitle(title), slugSet);
      const [created] = await tx
        .insert(nodeNoteDocuments)
        .values({
          userId,
          title: title.slice(0, 100),
          description: manifest.document.description?.slice(0, 500) || null,
          slug,
          viewport: manifest.viewport ? JSON.stringify(manifest.viewport) : null,
          updatedAt: new Date(),
        })
        .returning();
      documentId = created.id;
    }

    const idMap = new Map<string, string>();
    let nodesCreated = 0;

    for (let i = 0; i < manifest.nodes.length; i++) {
      const meta = manifest.nodes[i];
      const entry = zip.getEntry(meta.file);
      let contentMd = '';
      let title = meta.title;

      if (entry) {
        const parsed = parseMarkdownFile(entry.getData(), meta.file);
        title = parsed.title || meta.title;
        contentMd = parsed.contentMd;
      }

      const pos = meta.position ?? gridPosition(i);
      const size = meta.size ?? { width: 280, height: 160 };

      const [node] = await tx
        .insert(nodeNoteNodes)
        .values({
          documentId,
          title: title.slice(0, 200),
          contentMd: contentMd.slice(0, 32768),
          positionX: pos.x,
          positionY: pos.y,
          width: size.width,
          height: size.height,
          updatedAt: new Date(),
        })
        .returning();

      idMap.set(meta.id, node.id);
      nodesCreated += 1;
    }

    let edgesCreated = 0;
    for (const edge of manifest.edges) {
      const sourceId = idMap.get(edge.source);
      const targetId = idMap.get(edge.target);
      if (!sourceId || !targetId || sourceId === targetId) continue;

      try {
        await tx.insert(nodeNoteEdges).values({
          documentId,
          sourceId,
          targetId,
          label: edge.label?.slice(0, 50) || null,
        });
        edgesCreated += 1;
      } catch {
        // duplicate edge — skip
      }
    }

    return { documentId, nodesCreated, edgesCreated };
  });
}

export async function importMarkdownFiles(
  db: NodeNotesDrizzleDb,
  userId: string,
  documentId: string,
  files: Array<{ name: string; buffer: Buffer }>,
): Promise<number> {
  if (files.length > MAX_MD_FILES) {
    throw new Error(`单次最多导入 ${MAX_MD_FILES} 个 Markdown 文件`);
  }

  const [doc] = await db
    .select()
    .from(nodeNoteDocuments)
    .where(eq(nodeNoteDocuments.id, documentId))
    .limit(1);
  if (!doc || doc.userId !== userId) throw new Error('文档不存在');

  let created = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const parsed = parseMarkdownFile(file.buffer, file.name);
    const pos = gridPosition(i);
    await db.insert(nodeNoteNodes).values({
      documentId,
      title: parsed.title.trim().slice(0, 200),
      contentMd: (parsed.contentMd ?? '').slice(0, 32768),
      positionX: pos.x,
      positionY: pos.y,
      width: 280,
      height: 160,
      bgColor: normalizeHexColor(undefined, DEFAULT_NODE_BG),
      textColor: normalizeHexColor(undefined, DEFAULT_NODE_TEXT),
      updatedAt: new Date(),
    });
    created += 1;
  }

  await db
    .update(nodeNoteDocuments)
    .set({ updatedAt: new Date() })
    .where(eq(nodeNoteDocuments.id, documentId));

  return created;
}

export function isZipBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}
