import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from 'react';
import { MMDVisualNovel } from './MMDVisualNovel';
import { ModelSelectorSettings, ModelOption } from './ModelSelectorSettings';
import {
  MMDVisualNovelProps,
  MMDVisualNovelRef,
  VisualNovelScript,
} from './types';

/** 模型选择器配置 */
export interface ModelSelectorConfig {
  /** 人物模型选项列表 */
  characterModels: ModelOption[];
  /** 场景模型选项列表 */
  stageModels: ModelOption[];
  /** 默认选中的人物模型 ID（不提供则使用第一个） */
  defaultCharacterId?: string;
  /** 默认选中的场景模型 ID（不提供则使用第一个） */
  defaultStageId?: string;
  /** 人物模型标签文字 */
  characterLabel?: string;
  /** 场景模型标签文字 */
  stageLabel?: string;
}

export type ResourceMappingMode = 'full-clone' | 'resource-map';

/** 带模型选择器的视觉小说组件属性 */
export interface MMDVisualNovelWithSelectorProps extends Omit<MMDVisualNovelProps, 'script'> {
  /** 基础剧本配置（模型路径会被选择器覆盖） */
  script: VisualNovelScript;
  /** 模型选择器配置 */
  modelSelector: ModelSelectorConfig;
  /** 模型选择变化回调 */
  onModelSelectionChange?: (characterId: string, stageId: string) => void;
  /** 资源映射模式，默认 resource-map（轻量） */
  resourceMappingMode?: ResourceMappingMode;
}

/** 带模型选择器的视觉小说组件 Ref 接口 */
export interface MMDVisualNovelWithSelectorRef extends MMDVisualNovelRef {
  /** 获取当前选中的人物模型 ID */
  getSelectedCharacterId: () => string;
  /** 获取当前选中的场景模型 ID */
  getSelectedStageId: () => string;
  /** 设置人物模型 */
  setCharacterModel: (id: string) => void;
  /** 设置场景模型 */
  setStageModel: (id: string) => void;
}

/**
 * MMDVisualNovelWithSelector - 带模型选择器的视觉小说组件
 * 
 * 功能特性：
 * - 在设置界面中提供人物模型和场景模型的下拉选择器
 * - 选择的模型会应用到剧本中的所有节点
 * - 完全兼容 MMDVisualNovel 的所有功能
 * 
 * 使用示例：
 * ```tsx
 * <MMDVisualNovelWithSelector
 *   script={myScript}
 *   modelSelector={{
 *     characterModels: [
 *       { id: 'miku', name: '初音未来', path: '/models/miku.pmx' },
 *       { id: 'luka', name: '巡音流歌', path: '/models/luka.pmx' },
 *     ],
 *     stageModels: [
 *       { id: 'stage1', name: '教室', path: '/stages/classroom.pmx' },
 *       { id: 'stage2', name: '公园', path: '/stages/park.pmx' },
 *     ],
 *   }}
 * />
 * ```
 */
export const MMDVisualNovelWithSelector = forwardRef<
  MMDVisualNovelWithSelectorRef,
  MMDVisualNovelWithSelectorProps
>((props, ref) => {
  const {
    script,
    modelSelector,
    onModelSelectionChange,
    resourceMappingMode = 'resource-map',
    ...restProps
  } = props;

  const {
    characterModels,
    stageModels,
    defaultCharacterId,
    defaultStageId,
    characterLabel,
    stageLabel,
  } = modelSelector;

  // 内部 ref
  const visualNovelRef = useRef<MMDVisualNovelRef>(null);

  // 选中的模型 ID 状态
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    defaultCharacterId || characterModels[0]?.id || ''
  );
  const [selectedStageId, setSelectedStageId] = useState<string>(
    defaultStageId || stageModels[0]?.id || ''
  );

  // 获取选中的模型路径
  const selectedCharacterPath = useMemo(() => {
    const model = characterModels.find(m => m.id === selectedCharacterId);
    return model?.path || characterModels[0]?.path || '';
  }, [characterModels, selectedCharacterId]);

  const selectedStagePath = useMemo(() => {
    const model = stageModels.find(m => m.id === selectedStageId);
    return model?.path || stageModels[0]?.path || '';
  }, [stageModels, selectedStageId]);

  // 修改后的剧本（所有节点使用选中的模型）
  const modifiedScript = useMemo<VisualNovelScript>(() => {
    if (resourceMappingMode === 'full-clone') {
      return {
        ...script,
        nodes: script.nodes.map((node) => ({
          ...node,
          resources: {
            ...node.resources,
            modelPath: selectedCharacterPath as string,
            stageModelPath: selectedStagePath,
          },
        })),
      };
    }

    return {
      ...script,
      nodes: script.nodes.map((node) => {
        const nextModelPath = selectedCharacterPath as string;
        const nextStagePath = selectedStagePath;
        const resources = node.resources;

        if (resources.modelPath === nextModelPath && resources.stageModelPath === nextStagePath) {
          return node;
        }

        return {
          ...node,
          resources: {
            ...resources,
            modelPath: nextModelPath,
            stageModelPath: nextStagePath,
          },
        };
      }),
    };
  }, [script, selectedCharacterPath, selectedStagePath, resourceMappingMode]);

  // 处理人物模型选择变化
  const handleCharacterChange = useCallback((id: string) => {
    setSelectedCharacterId(id);
    onModelSelectionChange?.(id, selectedStageId);
  }, [selectedStageId, onModelSelectionChange]);

  // 处理场景模型选择变化
  const handleStageChange = useCallback((id: string) => {
    setSelectedStageId(id);
    onModelSelectionChange?.(selectedCharacterId, id);
  }, [selectedCharacterId, onModelSelectionChange]);

  // 自定义设置面板内容
  const customSettingsContent = useMemo(() => (
    <ModelSelectorSettings
      characterModels={characterModels}
      stageModels={stageModels}
      selectedCharacterId={selectedCharacterId}
      selectedStageId={selectedStageId}
      onCharacterChange={handleCharacterChange}
      onStageChange={handleStageChange}
      characterLabel={characterLabel}
      stageLabel={stageLabel}
    />
  ), [
    characterModels,
    stageModels,
    selectedCharacterId,
    selectedStageId,
    handleCharacterChange,
    handleStageChange,
    characterLabel,
    stageLabel,
  ]);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    // 继承 MMDVisualNovelRef 的所有方法
    goToNode: (nodeIndex: number, force?: boolean) => {
      visualNovelRef.current?.goToNode(nodeIndex, force);
    },
    goToDialogue: (dialogueIndex: number) => {
      visualNovelRef.current?.goToDialogue(dialogueIndex);
    },
    getCurrentNodeIndex: () => {
      return visualNovelRef.current?.getCurrentNodeIndex() ?? 0;
    },
    getCurrentDialogueIndex: () => {
      return visualNovelRef.current?.getCurrentDialogueIndex() ?? 0;
    },
    getHistory: () => {
      return visualNovelRef.current?.getHistory() ?? [];
    },
    getVariables: () => {
      return visualNovelRef.current?.getVariables() ?? {};
    },
    setVariable: (key: string, value: string | number | boolean) => {
      visualNovelRef.current?.setVariable(key, value);
    },
    setAutoMode: (enabled: boolean) => {
      visualNovelRef.current?.setAutoMode(enabled);
    },
    skipTyping: () => {
      visualNovelRef.current?.skipTyping();
    },
    triggerEffect: (effect) => {
      visualNovelRef.current?.triggerEffect?.(effect);
    },
    // 新增的模型选择方法
    getSelectedCharacterId: () => selectedCharacterId,
    getSelectedStageId: () => selectedStageId,
    setCharacterModel: (id: string) => {
      if (characterModels.some(m => m.id === id)) {
        handleCharacterChange(id);
      }
    },
    setStageModel: (id: string) => {
      if (stageModels.some(m => m.id === id)) {
        handleStageChange(id);
      }
    },
  }), [
    selectedCharacterId,
    selectedStageId,
    characterModels,
    stageModels,
    handleCharacterChange,
    handleStageChange,
  ]);

  return (
    <MMDVisualNovel
      ref={visualNovelRef}
      script={modifiedScript}
      customSettingsContent={customSettingsContent}
      {...restProps}
    />
  );
});

MMDVisualNovelWithSelector.displayName = 'MMDVisualNovelWithSelector';

export default MMDVisualNovelWithSelector;

