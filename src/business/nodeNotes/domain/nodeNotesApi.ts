import type {
  DocumentFormData,
  DocumentGraph,
  DocumentListItem,
  EdgeFormData,
  ImportMode,
  NodeFormData,
  NodeLinks,
  NodeNoteDocument,
  NodeNoteEdge,
  NodeNoteNode,
  ViewportState,
} from './types';
import { nodeNotesApiPath } from './nodeNotesApiPath';
import { nodeNotesFetch, nodeNotesFetchVoid } from './nodeNotesFetch';

export const nodeNotesApi = {
  async listDocuments(): Promise<DocumentListItem[]> {
    return nodeNotesFetch<DocumentListItem[]>(nodeNotesApiPath('documents'));
  },

  async createDocument(data: DocumentFormData): Promise<NodeNoteDocument> {
    return nodeNotesFetch<NodeNoteDocument>(nodeNotesApiPath('documents'), {
      method: 'POST',
      body: data,
    });
  },

  async updateDocument(
    id: string,
    data: Partial<DocumentFormData> & { viewport?: ViewportState | null },
  ): Promise<NodeNoteDocument> {
    return nodeNotesFetch<NodeNoteDocument>(nodeNotesApiPath(`documents/${id}`), {
      method: 'PUT',
      body: data,
    });
  },

  async deleteDocument(id: string): Promise<void> {
    await nodeNotesFetchVoid(nodeNotesApiPath(`documents/${id}`), { method: 'DELETE' });
  },

  async getGraph(id: string): Promise<DocumentGraph> {
    return nodeNotesFetch<DocumentGraph>(nodeNotesApiPath(`documents/${id}`));
  },

  async createNode(documentId: string, data: NodeFormData): Promise<NodeNoteNode> {
    return nodeNotesFetch<NodeNoteNode>(nodeNotesApiPath(`documents/${documentId}/nodes`), {
      method: 'POST',
      body: data,
    });
  },

  async updateNode(id: string, data: Partial<NodeFormData>): Promise<NodeNoteNode> {
    return nodeNotesFetch<NodeNoteNode>(nodeNotesApiPath(`nodes/${id}`), {
      method: 'PUT',
      body: data,
    });
  },

  async deleteNode(id: string): Promise<void> {
    await nodeNotesFetchVoid(nodeNotesApiPath(`nodes/${id}`), { method: 'DELETE' });
  },

  async createEdge(documentId: string, data: EdgeFormData): Promise<NodeNoteEdge> {
    return nodeNotesFetch<NodeNoteEdge>(nodeNotesApiPath(`documents/${documentId}/edges`), {
      method: 'POST',
      body: data,
    });
  },

  async updateEdge(
    id: string,
    data: { label?: string | null; color?: string },
  ): Promise<NodeNoteEdge> {
    return nodeNotesFetch<NodeNoteEdge>(nodeNotesApiPath(`edges/${id}`), {
      method: 'PUT',
      body: data,
    });
  },

  async deleteEdge(id: string): Promise<void> {
    await nodeNotesFetchVoid(nodeNotesApiPath(`edges/${id}`), { method: 'DELETE' });
  },

  async getNodeLinks(nodeId: string): Promise<NodeLinks> {
    return nodeNotesFetch<NodeLinks>(nodeNotesApiPath(`nodes/${nodeId}/links`));
  },

  async exportDocumentZip(documentId: string): Promise<void> {
    const res = await fetch(nodeNotesApiPath(`documents/${documentId}/export`), {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('导出失败');
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] || 'document.zip';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importFiles(
    files: File[],
    mode: ImportMode,
    targetDocumentId?: string,
  ): Promise<{ documentId: string; nodesCreated: number; edgesCreated: number }> {
    const form = new FormData();
    form.set('mode', mode);
    if (targetDocumentId) form.set('targetDocumentId', targetDocumentId);
    for (const file of files) form.append('files', file);

    return nodeNotesFetch<{ documentId: string; nodesCreated: number; edgesCreated: number }>(
      nodeNotesApiPath('documents/import'),
      { method: 'POST', body: form },
    );
  },
};
