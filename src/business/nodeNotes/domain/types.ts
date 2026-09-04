import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { nodeNoteDocuments, nodeNoteNodes, nodeNoteEdges } from '../server/schema';

export type NodeNoteDocument = InferSelectModel<typeof nodeNoteDocuments>;
export type NodeNoteNode = InferSelectModel<typeof nodeNoteNodes>;
export type NodeNoteEdge = InferSelectModel<typeof nodeNoteEdges>;

export type NewNodeNoteDocument = InferInsertModel<typeof nodeNoteDocuments>;
export type NewNodeNoteNode = InferInsertModel<typeof nodeNoteNodes>;
export type NewNodeNoteEdge = InferInsertModel<typeof nodeNoteEdges>;

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface DocumentFormData {
  title: string;
  description?: string;
  canvasBgColor?: string;
}

export interface DocumentListItem extends NodeNoteDocument {
  nodeCount: number;
  edgeCount: number;
}

export interface NodeFormData {
  title: string;
  contentMd?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  bgColor?: string;
  textColor?: string;
}

export interface EdgeFormData {
  sourceId: string;
  targetId: string;
  label?: string;
  color?: string;
}

export interface NodeLinkItem {
  edgeId: string;
  nodeId: string;
  title: string;
  label: string | null;
}

export interface NodeLinks {
  incoming: NodeLinkItem[];
  outgoing: NodeLinkItem[];
}

export interface DocumentGraph {
  document: NodeNoteDocument;
  nodes: NodeNoteNode[];
  edges: NodeNoteEdge[];
}

export interface NodeNotesManifestV1 {
  format: 'node-notes';
  formatVersion: 1;
  exportedAt: string;
  document: {
    title: string;
    description?: string | null;
  };
  viewport: ViewportState | null;
  nodes: Array<{
    id: string;
    title: string;
    file: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string | null;
  }>;
}

export type ImportMode = 'new-document' | 'merge';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
