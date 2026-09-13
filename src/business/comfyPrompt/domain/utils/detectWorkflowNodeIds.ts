type ApiNode = {
  class_type?: string;
  inputs?: Record<string, unknown>;
};

export type WorkflowNodeBindings = {
  positiveNodeId: string | null;
  negativeNodeId: string | null;
  seedNodeId: string | null;
  latentNodeId: string | null;
};

const SAMPLER_CLASS_TYPES = new Set([
  'KSampler',
  'KSamplerAdvanced',
  'SamplerCustom',
  'SamplerCustomAdvanced',
]);

const LATENT_CLASS_TYPES = new Set(['EmptyLatentImage', 'EmptySD3LatentImage']);

function isNodeRef(value: unknown): value is [string, number] {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === 'string';
}

export function isApiWorkflow(workflow: Record<string, unknown>): boolean {
  if ('nodes' in workflow && Array.isArray(workflow.nodes)) {
    return false;
  }
  return Object.values(workflow).some(
    (value) => value && typeof value === 'object' && 'class_type' in (value as object),
  );
}

/** 从 ComfyUI API 工作流 JSON 推断正向/负向/Seed/尺寸节点 ID */
export function detectWorkflowNodeIds(
  workflowJson: Record<string, unknown>,
): WorkflowNodeBindings {
  if (!isApiWorkflow(workflowJson)) {
    return {
      positiveNodeId: null,
      negativeNodeId: null,
      seedNodeId: null,
      latentNodeId: null,
    };
  }

  const workflow = workflowJson as Record<string, ApiNode>;
  let positiveNodeId: string | null = null;
  let negativeNodeId: string | null = null;
  let seedNodeId: string | null = null;
  let latentNodeId: string | null = null;

  for (const [nodeId, node] of Object.entries(workflow)) {
    const classType = node.class_type ?? '';
    const inputs = node.inputs ?? {};

    if (SAMPLER_CLASS_TYPES.has(classType)) {
      seedNodeId = nodeId;
      if (isNodeRef(inputs.positive)) positiveNodeId = inputs.positive[0];
      if (isNodeRef(inputs.negative)) negativeNodeId = inputs.negative[0];
      if (isNodeRef(inputs.latent_image)) latentNodeId = inputs.latent_image[0];
    }

    if (LATENT_CLASS_TYPES.has(classType) && !latentNodeId) {
      latentNodeId = nodeId;
    }

    if (classType === 'RandomNoise' && !seedNodeId) {
      seedNodeId = nodeId;
    }
  }

  return { positiveNodeId, negativeNodeId, seedNodeId, latentNodeId };
}
