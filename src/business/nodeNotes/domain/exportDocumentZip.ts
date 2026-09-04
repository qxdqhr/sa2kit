import AdmZip from 'adm-zip';
import type { DocumentGraph, NodeNotesManifestV1 } from './types';
import { parseViewport } from './viewport';

export function buildManifestFromGraph(graph: DocumentGraph): NodeNotesManifestV1 {
  const viewport = parseViewport(graph.document.viewport);

  return {
    format: 'node-notes',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    document: {
      title: graph.document.title,
      description: graph.document.description,
    },
    viewport,
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      title: n.title,
      file: `nodes/${n.id}.md`,
      position: { x: n.positionX, y: n.positionY },
      size: { width: n.width, height: n.height },
    })),
    edges: graph.edges.map((e) => ({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      label: e.label,
    })),
  };
}

export function buildNodeMarkdownFile(title: string, nodeId: string, contentMd: string): string {
  return `---\ntitle: ${JSON.stringify(title)}\nnodeId: ${nodeId}\n---\n\n${contentMd}`;
}

export function buildDocumentZip(graph: DocumentGraph): Buffer {
  const zip = new AdmZip();
  const manifest = buildManifestFromGraph(graph);
  zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));

  for (const node of graph.nodes) {
    zip.addFile(
      `nodes/${node.id}.md`,
      Buffer.from(buildNodeMarkdownFile(node.title, node.id, node.contentMd), 'utf8'),
    );
  }

  return zip.toBuffer();
}

export function isSafeZipPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('/') || normalized.includes('..')) return false;
  return true;
}

export function parseManifestFromZip(zip: AdmZip): NodeNotesManifestV1 | null {
  const entry = zip.getEntry('manifest.json');
  if (!entry) return null;
  try {
    const manifest = JSON.parse(entry.getData().toString('utf8')) as NodeNotesManifestV1;
    if (manifest.format !== 'node-notes' || manifest.formatVersion !== 1) return null;
    if (!Array.isArray(manifest.nodes) || !Array.isArray(manifest.edges)) return null;
    return manifest;
  } catch {
    return null;
  }
}
