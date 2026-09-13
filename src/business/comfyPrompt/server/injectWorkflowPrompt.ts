import { randomInt } from 'crypto';
import {
  detectWorkflowNodeIds,
  isApiWorkflow,
  type WorkflowNodeBindings,
} from '../domain/utils/detectWorkflowNodeIds';

export { detectWorkflowNodeIds, isApiWorkflow, type WorkflowNodeBindings };

/** ComfyUI KSampler 等节点常用 32 位无符号 seed 范围 */
export function generateComfySeed(): number {
  return randomInt(0, 2 ** 32);
}

type ApiNode = {
  class_type?: string;
  inputs?: Record<string, unknown>;
};

function resolveBindings(
  workflow: Record<string, ApiNode>,
  explicit: WorkflowNodeBindings,
): WorkflowNodeBindings {
  const detected = detectWorkflowNodeIds(workflow);
  return {
    positiveNodeId: explicit.positiveNodeId ?? detected.positiveNodeId,
    negativeNodeId: explicit.negativeNodeId ?? detected.negativeNodeId,
    seedNodeId: explicit.seedNodeId ?? detected.seedNodeId,
    latentNodeId: explicit.latentNodeId ?? detected.latentNodeId,
  };
}

function setNodeInput(
  workflow: Record<string, ApiNode>,
  nodeId: string | null | undefined,
  field: string,
  value: unknown,
) {
  if (!nodeId) return;
  const node = workflow[nodeId];
  if (!node) {
    throw new Error(`工作流中不存在节点 ${nodeId}`);
  }
  node.inputs = { ...(node.inputs ?? {}), [field]: value };
}

function resolveSeedField(node: ApiNode): string {
  const inputs = node.inputs ?? {};
  if ('seed' in inputs) return 'seed';
  if ('noise_seed' in inputs) return 'noise_seed';
  return 'seed';
}

function setSeedInput(
  workflow: Record<string, ApiNode>,
  nodeId: string | null | undefined,
  seed: number,
) {
  if (!nodeId) return;
  const node = workflow[nodeId];
  if (!node) {
    throw new Error(`工作流中不存在节点 ${nodeId}`);
  }
  setNodeInput(workflow, nodeId, resolveSeedField(node), seed);
}

export function injectWorkflowPrompt(
  workflowJson: Record<string, unknown>,
  options: {
    positivePrompt?: string;
    negativePrompt?: string;
    positiveNodeId?: string | null;
    negativeNodeId?: string | null;
    seedNodeId?: string | null;
    latentNodeId?: string | null;
    seed?: number;
    width?: number;
    height?: number;
  },
): Record<string, unknown> {
  if (!isApiWorkflow(workflowJson)) {
    throw new Error('请使用 ComfyUI API 格式的工作流 JSON（非界面导出的 nodes 数组格式）');
  }

  const workflow = structuredClone(workflowJson) as Record<string, ApiNode>;
  const bindings = resolveBindings(workflow, {
    positiveNodeId: options.positiveNodeId ?? null,
    negativeNodeId: options.negativeNodeId ?? null,
    seedNodeId: options.seedNodeId ?? null,
    latentNodeId: options.latentNodeId ?? null,
  });

  if (options.positivePrompt?.trim()) {
    if (!bindings.positiveNodeId) {
      throw new Error('无法注入正向 Prompt：工作流未配置正向节点 ID，且未能自动识别 KSampler 正向 CLIP 节点');
    }
    setNodeInput(workflow, bindings.positiveNodeId, 'text', options.positivePrompt.trim());
  }
  if (options.negativePrompt?.trim()) {
    if (!bindings.negativeNodeId) {
      throw new Error('无法注入负向 Prompt：工作流未配置负向节点 ID，且未能自动识别 KSampler 负向 CLIP 节点');
    }
    setNodeInput(workflow, bindings.negativeNodeId, 'text', options.negativePrompt.trim());
  }

  if (bindings.seedNodeId) {
    const seed = options.seed ?? generateComfySeed();
    setSeedInput(workflow, bindings.seedNodeId, seed);
  }

  if (bindings.latentNodeId) {
    if (options.width !== undefined) {
      setNodeInput(workflow, bindings.latentNodeId, 'width', options.width);
    }
    if (options.height !== undefined) {
      setNodeInput(workflow, bindings.latentNodeId, 'height', options.height);
    }
  }

  return workflow;
}
