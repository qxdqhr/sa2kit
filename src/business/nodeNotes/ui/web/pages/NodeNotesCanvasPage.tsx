'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesInitialized,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  FileUp,
  ImageDown,
  Loader2,
  Plus,
  Save,
} from 'lucide-react';
import { AuthGuard } from 'sa2kit/common/auth/components';
import { nodeNotesDocumentPath, nodeNotesGalleryPath } from '../../../domain/nodeNotesRoutes';
import { NoteNode, type NoteNodeData } from '../components/NoteNode';
import { NodeEditorPanel } from '../components/NodeEditorPanel';
import { EdgeStylePanel } from '../components/EdgeStylePanel';
import { MobileBottomSheet } from '../components/MobileBottomSheet';
import { MobileCanvasToolbar } from '../components/MobileCanvasToolbar';
import { CanvasSettingsPanel } from '../components/CanvasSettingsPanel';
import { AddNodeComposer, EMPTY_NODE_DRAFT, type NewNodeDraft } from '../components/AddNodeComposer';
import { useIsMobileCanvas } from '../hooks/useMediaQuery';
import { nodeNotesApi } from '../../../domain/nodeNotesApi';
import type { DocumentGraph, NodeNoteEdge, NodeNoteNode, ViewportState } from '../../../domain/types';
import { exportCanvasPng } from '../../../domain/exportCanvasPng';
import { DEFAULT_CANVAS_BG, DEFAULT_EDGE_COLOR, normalizeHexColor } from '../../../domain/nodeStyle';
import '../styles/node-notes-theme.css';

const nodeTypes = { note: NoteNode };
const PREVIEW_NODE_ID = '__node_preview__';
const FIT_VIEW_OPTIONS = { padding: 0.25, duration: 0, maxZoom: 1.2 } as const;

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toFlowNode(node: NodeNoteNode, selected: boolean, connectSource = false): Node<NoteNodeData> {
  const width = toFiniteNumber(node.width, 280);
  const height = toFiniteNumber(node.height, 160);
  return {
    id: node.id,
    type: 'note',
    position: {
      x: toFiniteNumber(node.positionX, 0),
      y: toFiniteNumber(node.positionY, 0),
    },
    data: {
      node: { ...node, width, height, positionX: toFiniteNumber(node.positionX, 0), positionY: toFiniteNumber(node.positionY, 0) },
      selected,
      connectSource,
    },
    style: { width, height },
  };
}

function toFlowEdge(edge: NodeNoteEdge, selected = false): Edge {
  const color = normalizeHexColor(edge.color, DEFAULT_EDGE_COLOR);
  return {
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    label: edge.label || undefined,
    selected,
    markerEnd: { type: MarkerType.ArrowClosed, color },
    style: { stroke: color, strokeWidth: selected ? 3 : 2 },
    labelStyle: { fill: color, fontSize: 11 },
  };
}

interface NodeNotesCanvasPageProps {
  documentId: string;
}

function CanvasInner({ documentId }: NodeNotesCanvasPageProps) {
  const router = useRouter();
  const isMobile = useIsMobileCanvas();
  const flowRef = useRef<HTMLDivElement>(null);
  const flowInstance = useRef<ReactFlowInstance<Node<NoteNodeData>, Edge> | null>(null);
  const autoFitAttemptedRef = useRef(false);
  const fitRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIsMobileRef = useRef<boolean | null>(null);
  const nodesInitialized = useNodesInitialized();
  const [graph, setGraph] = useState<DocumentGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [exportingPng, setExportingPng] = useState(false);
  const [importing, setImporting] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [addNodeComposerOpen, setAddNodeComposerOpen] = useState(false);
  const [newNodeDraft, setNewNodeDraft] = useState<NewNodeDraft>(EMPTY_NODE_DRAFT);
  const [addingNode, setAddingNode] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NoteNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const contentTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const positionTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const edgeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const canvasColorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canvasBgColor = normalizeHexColor(graph?.document.canvasBgColor, DEFAULT_CANVAS_BG);

  const focusFlowNode = useCallback((nodeId: string, padding = 0.35) => {
    requestAnimationFrame(() => {
      flowInstance.current?.fitView({
        nodes: [{ id: nodeId }],
        padding,
        duration: 300,
        maxZoom: 1.25,
      });
    });
  }, []);

  const getRealFlowNodes = useCallback(() => {
    return (
      flowInstance.current?.getNodes().filter((node) => node.id !== PREVIEW_NODE_ID) ?? []
    );
  }, []);

  const fitAllNodes = useCallback((options?: { duration?: number; nodeId?: string }) => {
    const { duration = 300, nodeId } = options ?? {};
    const instance = flowInstance.current;
    const container = flowRef.current;
    if (!instance || !container) return;

    const realNodes = getRealFlowNodes();
    if (!realNodes.length) return;

    if (nodeId) {
      void instance.fitView({
        nodes: [{ id: nodeId }],
        padding: 0.35,
        duration,
        maxZoom: 1.25,
      });
      return;
    }

    void instance.fitView({
      ...FIT_VIEW_OPTIONS,
      duration,
      maxZoom: 1.2,
    });
  }, [getRealFlowNodes]);

  const fitCanvas = useCallback(
    (nodeId?: string) => {
      fitAllNodes(nodeId ? { nodeId, duration: 300 } : { duration: 300 });
    },
    [fitAllNodes],
  );

  const applyConnectHighlight = useCallback(
    (sourceId: string | null) => {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, connectSource: n.id === sourceId },
        })),
      );
    },
    [setNodes],
  );

  const createEdgeBetween = useCallback(
    async (sourceId: string, targetId: string) => {
      if (sourceId === targetId) {
        toast.error('不能创建自环有向边');
        return;
      }
      try {
        const edge = await nodeNotesApi.createEdge(documentId, { sourceId, targetId });
        setEdges((eds) => addEdge(toFlowEdge(edge, false), eds));
        setGraph((g) => (g ? { ...g, edges: [...g.edges, edge] } : g));
        toast.success('已创建有向边');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '连线失败');
      }
    },
    [documentId, setEdges],
  );

  const loadGraph = useCallback(async () => {
    setLoading(true);
    autoFitAttemptedRef.current = false;
    if (fitRetryTimer.current) clearTimeout(fitRetryTimer.current);
    try {
      const data = await nodeNotesApi.getGraph(documentId);
      setGraph(data);
      setNodes(data.nodes.map((n) => toFlowNode(n, false)));
      setEdges(data.edges.map((e) => toFlowEdge(e, false)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [documentId, setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  useEffect(() => {
    if (loading || !graph?.nodes.length || !nodesInitialized || autoFitAttemptedRef.current) return;

    autoFitAttemptedRef.current = true;

    const run = (attempt = 0) => {
      const instance = flowInstance.current;
      const container = flowRef.current;
      if (instance && container && getRealFlowNodes().length > 0) {
        const { width, height } = container.getBoundingClientRect();
        if (width >= 80 && height >= 120) {
          void instance.fitView(FIT_VIEW_OPTIONS);
          return;
        }
      }

      if (attempt < 24) {
        fitRetryTimer.current = setTimeout(() => run(attempt + 1), 80);
      }
    };

    if (fitRetryTimer.current) clearTimeout(fitRetryTimer.current);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => run());
    });
  }, [loading, graph?.nodes.length, nodesInitialized, getRealFlowNodes]);

  useEffect(() => {
    if (lastIsMobileRef.current === isMobile) return;
    lastIsMobileRef.current = isMobile;
    if (loading || !graph?.nodes.length || !nodesInitialized) return;
    fitAllNodes({ duration: 0 });
  }, [isMobile, loading, graph?.nodes.length, nodesInitialized, fitAllNodes]);

  useEffect(
    () => () => {
      if (fitRetryTimer.current) clearTimeout(fitRetryTimer.current);
    },
    [],
  );

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !graph) return null;
    return graph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [graph, selectedNodeId]);

  const selectedEdge = useMemo(() => {
    if (!selectedEdgeId || !graph) return null;
    return graph.edges.find((e) => e.id === selectedEdgeId) ?? null;
  }, [graph, selectedEdgeId]);

  const handleCanvasBgChange = useCallback(
    (canvasBgColor: string) => {
      const normalized = normalizeHexColor(canvasBgColor, DEFAULT_CANVAS_BG);
      setGraph((g) =>
        g ? { ...g, document: { ...g.document, canvasBgColor: normalized } } : g,
      );
      setSaveState('saving');
      if (canvasColorTimer.current) clearTimeout(canvasColorTimer.current);
      canvasColorTimer.current = setTimeout(async () => {
        try {
          await nodeNotesApi.updateDocument(documentId, { canvasBgColor: normalized });
          setSaveState('saved');
        } catch (e) {
          setSaveState('error');
          toast.error(e instanceof Error ? e.message : '画布颜色保存失败');
        }
      }, 400);
    },
    [documentId],
  );

  const scheduleContentSave = useCallback((nodeId: string, patch: Partial<NodeNoteNode>) => {
    setSaveState('saving');
    const prev = contentTimers.current.get(nodeId);
    if (prev) clearTimeout(prev);
    const timer = setTimeout(async () => {
      try {
        const updated = await nodeNotesApi.updateNode(nodeId, {
          title: patch.title,
          contentMd: patch.contentMd,
          bgColor: patch.bgColor,
          textColor: patch.textColor,
        });
        setGraph((g) =>
          g
            ? {
                ...g,
                nodes: g.nodes.map((n) => (n.id === nodeId ? { ...n, ...updated } : n)),
              }
            : g,
        );
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, node: { ...n.data.node, ...updated } } }
              : n,
          ),
        );
        setSaveState('saved');
      } catch (e) {
        setSaveState('error');
        toast.error(e instanceof Error ? e.message : '保存失败');
      }
    }, 800);
    contentTimers.current.set(nodeId, timer);
  }, [setNodes]);

  const schedulePositionSave = useCallback(
    (nodeId: string, x: number, y: number) => {
      setSaveState('saving');
      const prev = positionTimers.current.get(nodeId);
      if (prev) clearTimeout(prev);
      const timer = setTimeout(async () => {
        try {
          await nodeNotesApi.updateNode(nodeId, { positionX: x, positionY: y });
          setSaveState('saved');
        } catch {
          setSaveState('error');
        }
      }, 500);
      positionTimers.current.set(nodeId, timer);
    },
    [],
  );

  const handleNodeChange = useCallback(
    (patch: Partial<Pick<NodeNoteNode, 'title' | 'contentMd' | 'bgColor' | 'textColor'>>) => {
      if (!selectedNodeId) return;
      setGraph((g) =>
        g
          ? {
              ...g,
              nodes: g.nodes.map((n) =>
                n.id === selectedNodeId ? { ...n, ...patch } : n,
              ),
            }
          : g,
      );
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  node: { ...n.data.node, ...patch },
                  selected: true,
                },
              }
            : n,
        ),
      );
      scheduleContentSave(selectedNodeId, patch);
    },
    [selectedNodeId, scheduleContentSave, setNodes],
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      await createEdgeBetween(connection.source, connection.target);
    },
    [createEdgeBetween],
  );

  const scheduleEdgeSave = useCallback(
    (edgeId: string, patch: Partial<Pick<NodeNoteEdge, 'label' | 'color'>>) => {
      setSaveState('saving');
      const prev = edgeTimers.current.get(edgeId);
      if (prev) clearTimeout(prev);
      const timer = setTimeout(async () => {
        try {
          const updated = await nodeNotesApi.updateEdge(edgeId, patch);
          setGraph((g) =>
            g
              ? {
                  ...g,
                  edges: g.edges.map((e) => (e.id === edgeId ? { ...e, ...updated } : e)),
                }
              : g,
          );
          setEdges((eds) =>
            eds.map((e) => (e.id === edgeId ? toFlowEdge(updated, true) : e)),
          );
          setSaveState('saved');
        } catch (e) {
          setSaveState('error');
          toast.error(e instanceof Error ? e.message : '保存失败');
        }
      }, 400);
      edgeTimers.current.set(edgeId, timer);
    },
    [setEdges],
  );

  const handleEdgeChange = useCallback(
    (patch: Partial<Pick<NodeNoteEdge, 'label' | 'color'>>) => {
      if (!selectedEdgeId || !graph) return;
      setGraph((g) =>
        g
          ? {
              ...g,
              edges: g.edges.map((e) => (e.id === selectedEdgeId ? { ...e, ...patch } : e)),
            }
          : g,
      );
      const edge = graph.edges.find((e) => e.id === selectedEdgeId);
      if (edge) {
        const merged = { ...edge, ...patch };
        setEdges((eds) =>
          eds.map((e) => (e.id === selectedEdgeId ? toFlowEdge(merged, true) : { ...e, selected: false })),
        );
      }
      scheduleEdgeSave(selectedEdgeId, patch);
    },
    [selectedEdgeId, graph, scheduleEdgeSave, setEdges],
  );

  const getDraftNodePosition = useCallback(() => {
    const instance = flowInstance.current;
    if (instance) {
      const flowArea = flowRef.current?.getBoundingClientRect();
      const centerX = flowArea
        ? flowArea.left + flowArea.width / 2
        : window.innerWidth / 2;
      const centerY = flowArea
        ? flowArea.top + flowArea.height / 2
        : (window.innerHeight - (isMobile ? 180 : 80)) / 2;
      return instance.screenToFlowPosition({ x: centerX, y: centerY });
    }
    return { x: 120 + Math.random() * 80, y: 120 + Math.random() * 80 };
  }, [isMobile]);

  const removePreviewNode = useCallback(() => {
    setNodes((nds) => nds.filter((n) => n.id !== PREVIEW_NODE_ID));
  }, [setNodes]);

  const syncPreviewNode = useCallback(
    (draft: NewNodeDraft) => {
      const { x, y } = getDraftNodePosition();
      const previewRecord: NodeNoteNode = {
        id: PREVIEW_NODE_ID,
        documentId,
        title: draft.title.trim() || '新节点',
        contentMd: draft.contentMd,
        positionX: x,
        positionY: y,
        width: 280,
        height: 160,
        bgColor: draft.bgColor,
        textColor: draft.textColor,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setNodes((nds) => {
        const rest = nds.filter((n) => n.id !== PREVIEW_NODE_ID);
        return [
          ...rest,
          {
            id: PREVIEW_NODE_ID,
            type: 'note',
            position: { x, y },
            data: { node: previewRecord, selected: false, isPreview: true },
            style: { width: 280, height: 160, zIndex: 5 },
            draggable: false,
            selectable: false,
            focusable: false,
          },
        ];
      });
    },
    [documentId, getDraftNodePosition, setNodes],
  );

  const openAddNodeComposer = useCallback(() => {
    const draft = { ...EMPTY_NODE_DRAFT };
    setNewNodeDraft(draft);
    setAddNodeComposerOpen(true);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setMobileSheetOpen(false);
    setConnectMode(false);
    setConnectSourceId(null);
    applyConnectHighlight(null);
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, selected: false, connectSource: false },
      })),
    );
    requestAnimationFrame(() => syncPreviewNode(draft));
  }, [applyConnectHighlight, setNodes, setEdges, syncPreviewNode]);

  const closeAddNodeComposer = useCallback(() => {
    setAddNodeComposerOpen(false);
    setNewNodeDraft(EMPTY_NODE_DRAFT);
    removePreviewNode();
  }, [removePreviewNode]);

  const confirmAddNodeFromComposer = useCallback(async () => {
    if (addingNode) return;
    const title = newNodeDraft.title.trim();
    if (!title) {
      toast.error('请填写节点标题');
      return;
    }

    setAddingNode(true);
    try {
      const { x: positionX, y: positionY } = getDraftNodePosition();
      const node = await nodeNotesApi.createNode(documentId, {
        title,
        contentMd: newNodeDraft.contentMd,
        bgColor: newNodeDraft.bgColor,
        textColor: newNodeDraft.textColor,
        positionX,
        positionY,
      });

      removePreviewNode();
      setGraph((g) => (g ? { ...g, nodes: [...g.nodes, node] } : g));
      setNodes((nds) => [...nds.filter((n) => n.id !== PREVIEW_NODE_ID), toFlowNode(node, true)]);
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
      setAddNodeComposerOpen(false);
      setNewNodeDraft(EMPTY_NODE_DRAFT);

      requestAnimationFrame(() => {
        focusFlowNode(node.id);
      });

      if (isMobile) {
        setMobileSheetOpen(true);
      }
      toast.success('节点已添加到画布');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '添加失败');
    } finally {
      setAddingNode(false);
    }
  }, [
    addingNode,
    newNodeDraft,
    getDraftNodePosition,
    documentId,
    removePreviewNode,
    setNodes,
    isMobile,
    focusFlowNode,
  ]);

  const handleNodeDragStop = useCallback<NonNullable<ComponentProps<typeof ReactFlow>['onNodeDragStop']>>(
    (_, node) => {
      schedulePositionSave(node.id, node.position.x, node.position.y);
    },
    [schedulePositionSave],
  );

  useEffect(() => {
    if (!addNodeComposerOpen) return;
    syncPreviewNode(newNodeDraft);
  }, [addNodeComposerOpen, newNodeDraft, syncPreviewNode]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<NoteNodeData>) => {
      if (node.id === PREVIEW_NODE_ID) return;

      if (isMobile && connectMode) {
        if (!connectSourceId) {
          setConnectSourceId(node.id);
          applyConnectHighlight(node.id);
          toast('再点击目标节点完成连线');
          return;
        }
        if (connectSourceId === node.id) {
          setConnectSourceId(null);
          applyConnectHighlight(null);
          return;
        }
        void createEdgeBetween(connectSourceId, node.id);
        setConnectSourceId(null);
        applyConnectHighlight(null);
        return;
      }

      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
      setMobileSheetOpen(false);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, selected: n.id === node.id, connectSource: false },
        })),
      );
      setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
    },
    [isMobile, connectMode, connectSourceId, applyConnectHighlight, createEdgeBetween, setNodes, setEdges],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (isMobile && connectMode) {
        toast('连线模式下请点选节点，而非连接线');
        return;
      }
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
      setMobileSheetOpen(false);
      setConnectSourceId(null);
      applyConnectHighlight(null);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, selected: false, connectSource: false },
        })),
      );
      setEdges((eds) =>
        eds.map((e) => {
          const graphEdge = graph?.edges.find((ge) => ge.id === e.id);
          if (!graphEdge) return { ...e, selected: e.id === edge.id };
          return toFlowEdge(graphEdge, e.id === edge.id);
        }),
      );
    },
    [isMobile, connectMode, graph, applyConnectHighlight, setNodes, setEdges],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setMobileSheetOpen(false);
    setConnectSourceId(null);
    applyConnectHighlight(null);
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, selected: false, connectSource: false } })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false, style: { ...e.style, strokeWidth: 2 } })));
  }, [applyConnectHighlight, setNodes, setEdges]);

  const handleToggleConnect = useCallback(() => {
    setConnectMode((on) => {
      const next = !on;
      if (!next) {
        setConnectSourceId(null);
        applyConnectHighlight(null);
      } else {
        setMobileSheetOpen(false);
        toast('连线模式：先点源节点，再点目标节点');
      }
      return next;
    });
  }, [applyConnectHighlight]);

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedNodeId) return;
    if (!confirm('确定删除该节点？关联的有向边将一并删除。')) return;
    try {
      await nodeNotesApi.deleteNode(selectedNodeId);
      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
      );
      setGraph((g) =>
        g
          ? {
              ...g,
              nodes: g.nodes.filter((n) => n.id !== selectedNodeId),
              edges: g.edges.filter(
                (e) => e.sourceId !== selectedNodeId && e.targetId !== selectedNodeId,
              ),
            }
          : g,
      );
      setSelectedNodeId(null);
      setMobileSheetOpen(false);
      toast.success('节点已删除');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  }, [selectedNodeId, setNodes, setEdges]);

  const handleDeleteEdge = useCallback(async () => {
    if (!selectedEdgeId) return;
    if (!confirm('确定删除该连接线？')) return;
    try {
      await nodeNotesApi.deleteEdge(selectedEdgeId);
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
      setGraph((g) =>
        g ? { ...g, edges: g.edges.filter((e) => e.id !== selectedEdgeId) } : g,
      );
      setSelectedEdgeId(null);
      setMobileSheetOpen(false);
      toast.success('连接线已删除');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  }, [selectedEdgeId, setEdges]);

  const handleMobileDeleteSelection = useCallback(() => {
    if (selectedEdgeId) void handleDeleteEdge();
    else if (selectedNodeId) void handleDeleteSelected();
  }, [selectedEdgeId, selectedNodeId, handleDeleteEdge, handleDeleteSelected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        handleDeleteSelected();
      }
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setMobileSheetOpen(false);
        setAddNodeComposerOpen(false);
        removePreviewNode();
        setConnectMode(false);
        setConnectSourceId(null);
        applyConnectHighlight(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleDeleteSelected, applyConnectHighlight, removePreviewNode]);

  const persistViewport = useCallback(
    async (viewport: ViewportState) => {
      try {
        await nodeNotesApi.updateDocument(documentId, { viewport });
      } catch {
        // non-blocking
      }
    },
    [documentId],
  );

  const handleExportMd = useCallback(async () => {
    try {
      await nodeNotesApi.exportDocumentZip(documentId);
      toast.success('Markdown 包已下载');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '导出失败');
    }
  }, [documentId]);

  const handleImportMd = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,.md';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      setImporting(true);
      try {
        const isZip = files.length === 1 && files[0].name.endsWith('.zip');
        const result = await nodeNotesApi.importFiles(
          files,
          isZip ? 'merge' : 'merge',
          documentId,
        );
        if (result.documentId !== documentId) {
          router.push(nodeNotesDocumentPath(result.documentId));
        } else {
          await loadGraph();
        }
        toast.success(`导入完成：${result.nodesCreated} 个节点`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '导入失败');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  }, [documentId, loadGraph, router]);

  const handleExportPng = useCallback(
    async (mode: 'viewport' | 'full') => {
      if (!flowRef.current || !graph) return;
      if (mode === 'full' && graph.nodes.length > 100) {
        if (!confirm('节点较多，完整画布导出可能较慢，是否继续？')) return;
      }
      setExportingPng(true);
      try {
        const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
        await exportCanvasPng(flowRef.current, `${graph.document.slug}-${stamp}.png`, mode);
        toast.success('PNG 已下载');
      } catch {
        toast.error('图片导出失败');
      } finally {
        setExportingPng(false);
      }
    },
    [graph],
  );

  const focusNode = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, selected: n.id === nodeId },
          selected: n.id === nodeId,
        })),
      );
    },
    [setNodes],
  );

  if (!graph && !loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--nn-shell-bg)] text-[var(--nn-shell-text)]">
        <p>文档不存在或无法加载</p>
        <Link href={nodeNotesGalleryPath()} className="text-[var(--nn-accent)] underline">
          返回文档列表
        </Link>
      </div>
    );
  }

  const saveLabel =
    saveState === 'saving' ? '保存中…' : saveState === 'error' ? '保存失败' : '已保存';

  const selectionLabel = selectedNode
    ? `节点：${selectedNode.title}`
    : selectedEdge
      ? '连接线'
      : '';

  const mobileSheetTitle = selectedEdge ? '连接线样式' : selectedNode ? '节点编辑' : '';
  const documentTitle = graph?.document.title ?? '加载中…';
  const nodeCount = graph?.nodes.length ?? 0;
  const edgeCount = graph?.edges.length ?? 0;

  return (
    <div className="node-notes-root flex h-dvh min-h-0 flex-col overflow-hidden bg-[var(--nn-shell-bg)]">
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--nn-shell-border)] px-3 py-2 sm:px-4">
        <Link
          href={nodeNotesGalleryPath()}
          className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-[var(--nn-shell-muted)] transition-colors duration-200 hover:bg-[var(--nn-shell-surface)] hover:text-[var(--nn-shell-text)]"
          aria-label="返回文档列表"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-[var(--nn-shell-text)] sm:text-lg">
          {documentTitle}
        </h1>
        <span className="rounded-full bg-[var(--nn-shell-surface)] px-2 py-0.5 text-xs text-[var(--nn-shell-muted)]">
          {nodeCount} 节点
        </span>
        <span
          className="flex items-center gap-1 text-xs text-[var(--nn-shell-muted)]"
          title={saveLabel}
        >
          <Save className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{saveLabel}</span>
        </span>
        <button
          type="button"
          onClick={openAddNodeComposer}
          className="hidden lg:inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--nn-primary)] px-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--nn-primary-hover)]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          节点
        </button>
        <button
          type="button"
          onClick={handleImportMd}
          disabled={importing}
          className="hidden lg:inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--nn-shell-border)] px-3 text-sm text-[var(--nn-shell-text)] transition-colors duration-200 hover:bg-[var(--nn-shell-surface)] disabled:opacity-50"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          导入
        </button>
        <button
          type="button"
          onClick={handleExportMd}
          className="hidden lg:inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--nn-shell-border)] px-3 text-sm text-[var(--nn-shell-text)] transition-colors duration-200 hover:bg-[var(--nn-shell-surface)]"
        >
          <Download className="h-4 w-4" aria-hidden />
          导出 MD
        </button>
        <div className="relative group hidden lg:block">
          <button
            type="button"
            disabled={exportingPng}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--nn-shell-border)] px-3 text-sm text-[var(--nn-shell-text)] transition-colors duration-200 hover:bg-[var(--nn-shell-surface)] disabled:opacity-50"
          >
            {exportingPng ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageDown className="h-4 w-4" aria-hidden />
            )}
            导出图片
          </button>
          <div className="absolute right-0 top-full z-20 hidden min-w-[140px] rounded-lg border border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] py-1 shadow-lg group-focus-within:block group-hover:block">
            <button
              type="button"
              onClick={() => handleExportPng('viewport')}
              className="block min-h-11 w-full cursor-pointer px-3 text-left text-sm hover:bg-[var(--nn-shell-bg)]"
            >
              当前视口
            </button>
            <button
              type="button"
              onClick={() => handleExportPng('full')}
              className="block min-h-11 w-full cursor-pointer px-3 text-left text-sm hover:bg-[var(--nn-shell-bg)]"
            >
              完整画布
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          ref={flowRef}
          className="relative min-h-0 w-full flex-1"
          style={{ backgroundColor: canvasBgColor }}
        >
          {loading ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--nn-shell-bg)]/40 backdrop-blur-[1px]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--nn-primary)]" aria-label="加载中" />
            </div>
          ) : null}
          <ReactFlow
            className="h-full w-full"
            style={{ backgroundColor: canvasBgColor }}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeDragStop={handleNodeDragStop}
            onInit={(instance) => {
              flowInstance.current = instance;
            }}
            onMoveEnd={(_, viewport) => {
              if (!autoFitAttemptedRef.current) return;
              persistViewport({ x: viewport.x, y: viewport.y, zoom: viewport.zoom });
              if (addNodeComposerOpen) syncPreviewNode(newNodeDraft);
            }}
            nodeTypes={nodeTypes}
            minZoom={0.2}
            maxZoom={2.5}
            nodesDraggable
            nodesConnectable={!isMobile}
            elementsSelectable
            edgesFocusable
            panOnDrag={isMobile ? true : [1, 2]}
            panOnScroll={false}
            zoomOnScroll={!isMobile}
            zoomOnPinch
            preventScrolling
            defaultEdgeOptions={{
              markerEnd: { type: MarkerType.ArrowClosed, color: DEFAULT_EDGE_COLOR },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="var(--nn-canvas-grid)" gap={20} />
            <Controls className="!rounded-lg !border-slate-200 !shadow-sm" />
            <MiniMap
              className="!hidden lg:!block !rounded-lg !border-slate-200 !shadow-sm"
              nodeColor="#7c3aed"
              maskColor="rgba(0,0,0,0.08)"
            />
            <Panel
              position="top-left"
              className="hidden rounded-lg bg-white/90 px-2 py-1 text-xs text-slate-600 shadow-sm lg:block"
            >
              点击节点/连接线设置样式 · 从右侧圆点拖向左侧圆点建边 →
            </Panel>
          </ReactFlow>

          <MobileCanvasToolbar
            connectMode={connectMode}
            connectSourceId={connectSourceId}
            hasSelection={Boolean(selectedNode || selectedEdge)}
            selectionLabel={selectionLabel}
            importing={importing}
            exportingPng={exportingPng}
            onBeginAddNode={openAddNodeComposer}
            onToggleConnect={handleToggleConnect}
            onFitView={() => fitCanvas()}
            onEditSelection={() => setMobileSheetOpen(true)}
            onDeleteSelection={handleMobileDeleteSelection}
            onImport={handleImportMd}
            onExportMd={handleExportMd}
            onExportPngViewport={() => handleExportPng('viewport')}
            onExportPngFull={() => handleExportPng('full')}
          />
        </div>

        <div className="hidden lg:flex lg:min-h-0 lg:w-80 lg:shrink-0">
          {selectedEdge ? (
            <EdgeStylePanel
              edge={selectedEdge}
              onChange={handleEdgeChange}
              onDelete={handleDeleteEdge}
            />
          ) : selectedNode ? (
            <NodeEditorPanel
              node={selectedNode}
              onChange={handleNodeChange}
              onFocusNode={focusNode}
              onDelete={handleDeleteSelected}
            />
          ) : (
            <CanvasSettingsPanel
              nodeCount={nodeCount}
              edgeCount={edgeCount}
              canvasBgColor={canvasBgColor}
              onCanvasBgChange={handleCanvasBgChange}
              onFitAllNodes={fitAllNodes}
            />
          )}
        </div>
      </div>

      <MobileBottomSheet
        open={isMobile && mobileSheetOpen && Boolean(selectedNode || selectedEdge)}
        title={mobileSheetTitle}
        onClose={() => setMobileSheetOpen(false)}
      >
        {selectedEdge ? (
          <EdgeStylePanel
            embedded
            edge={selectedEdge}
            onChange={handleEdgeChange}
            onDelete={handleDeleteEdge}
          />
        ) : selectedNode ? (
          <NodeEditorPanel
            embedded
            node={selectedNode}
            onChange={handleNodeChange}
            onFocusNode={(id) => {
              focusNode(id);
              fitCanvas(id);
            }}
            onDelete={handleDeleteSelected}
          />
        ) : null}
      </MobileBottomSheet>

      <AddNodeComposer
        open={addNodeComposerOpen}
        creating={addingNode}
        draft={newNodeDraft}
        onChange={(patch) => setNewNodeDraft((d) => ({ ...d, ...patch }))}
        onConfirm={confirmAddNodeFromComposer}
        onCancel={closeAddNodeComposer}
      />
    </div>
  );
}

export default function NodeNotesCanvasPage({ documentId }: NodeNotesCanvasPageProps) {
  return (
    <AuthGuard>
      <ReactFlowProvider>
        <CanvasInner documentId={documentId} />
      </ReactFlowProvider>
    </AuthGuard>
  );
}
