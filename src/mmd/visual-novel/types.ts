/**
 * MMD Visual Novel (Galgame 风格) 类型定义
 */

import { MMDResources, MMDStage, MobileOptimization } from '../types';

/** 单条对话/文案 */
export interface DialogueLine {
  /** 唯一标识 */
  id: string;
  /** 说话者名称（可选，不填则不显示名称栏） */
  speaker?: string;
  /** 说话者名称颜色 */
  speakerColor?: string;
  /** 对话文本内容 */
  text: string;
  /** 文字显示速度（毫秒/字符），默认 50 */
  typeSpeed?: number;
  /** 是否等待用户点击才显示下一条（默认 true） */
  waitForClick?: boolean;
  /** 自动等待时间（毫秒），仅在 waitForClick 为 false 时生效 */
  autoDelay?: number;
  /** 对话时的表情/动作切换（可选） */
  expression?: string;
  /** 对话时播放的音效（可选） */
  voicePath?: string;
  /** 对话中插入的分支选项（可选，若有则显示选项） */
  choices?: DialogueChoice[];
}

/** 分支判定逻辑 */
export interface BranchCondition {
  /** 变量名 */
  key: string;
  /** 变量值与节点索引的映射 */
  map: Record<string | number, number>;
  /** 默认跳转的节点索引 */
  defaultIndex: number;
}

/** 对话分支选项 */
export interface DialogueChoice {
  /** 选项文字 */
  text: string;
  /** 跳转到的节点索引（可选，若不填则继续当前剧情） */
  nextNodeIndex?: number;
  /** 跳转到的对话索引（可选，默认 0） */
  nextDialogueIndex?: number;
  /** 设置变量（可选，用于后续剧情判定） */
  setVariable?: {
    key: string;
    value: string | number | boolean;
  };
  /** 选项点击后的回调（可选） */
  onSelect?: () => void;
}

/** 视觉小说播放节点 */
export interface VisualNovelNode {
  /** 唯一标识 */
  id: string;
  /** 节点名称（用于调试） */
  name?: string;
  /** MMD 资源配置（模型、动作等） */
  resources: MMDResources;
  /** 该节点的对话数组（按顺序播放） */
  dialogues: DialogueLine[];
  /** 节点特定的舞台配置（可选，覆盖全局配置） */
  stage?: MMDStage;
  /** 节点结束时的分支选项（可选，已废弃，建议使用 DialogueLine.choices） */
  choices?: DialogueChoice[];
  /** 节点结束时的分支判定逻辑（可选，根据变量跳转不同节点） */
  nextCondition?: BranchCondition;
  /** 节点开始时播放的背景音乐（可选） */
  bgmPath?: string;
  /** 背景音乐音量 0-1（默认 0.5） */
  bgmVolume?: number;
  /** 节点是否循环 MMD 动画（对话期间循环，默认 true） */
  loopAnimation?: boolean;
}

/** 视觉小说剧本配置 */
export interface VisualNovelScript {
  /** 剧本唯一标识 */
  id: string;
  /** 剧本名称 */
  name: string;
  /** 播放节点列表 */
  nodes: VisualNovelNode[];
  /** 是否在剧本结束后循环（默认 false） */
  loop?: boolean;
}

/** 对话框主题配置 */
export interface DialogueBoxTheme {
  /** 对话框背景颜色 */
  backgroundColor?: string;
  /** 对话框边框颜色 */
  borderColor?: string;
  /** 对话框文字颜色 */
  textColor?: string;
  /** 说话者名称背景颜色 */
  speakerBgColor?: string;
  /** 说话者名称文字颜色 */
  speakerTextColor?: string;
  /** 对话框透明度 0-1（默认 0.85） */
  opacity?: number;
  /** 对话框模糊度（backdrop-blur，默认 8px） */
  blur?: string;
  /** 点击继续提示文字 */
  continueHint?: string;
  /** 是否显示点击继续提示（默认 true） */
  showContinueHint?: boolean;
}

/** 视觉小说组件属性 */
export interface MMDVisualNovelProps {
  /** 剧本配置 */
  script: VisualNovelScript;
  /** 舞台配置 */
  stage?: MMDStage;
  /** 移动端优化配置 */
  mobileOptimization?: MobileOptimization;
  /** 对话框主题 */
  dialogueTheme?: DialogueBoxTheme;
  
  /** 是否自动开始（默认 true） */
  autoStart?: boolean;
  /** 初始节点索引（默认 0） */
  initialNodeIndex?: number;
  /** 初始对话索引（默认 0） */
  initialDialogueIndex?: number;
  
  /** 事件回调 */
  onNodeChange?: (node: VisualNovelNode, index: number) => void;
  onDialogueChange?: (dialogue: DialogueLine, index: number, nodeIndex: number) => void;
  onScriptComplete?: () => void;
  onError?: (error: Error) => void;
  
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
  /** 是否显示快进按钮 */
  showSkipButton?: boolean;
  /** 是否显示自动播放按钮 */
  showAutoButton?: boolean;
  /** 是否显示历史记录按钮 */
  showHistoryButton?: boolean;
  
  /** 样式 */
  className?: string;
  style?: React.CSSProperties;
}

/** 对话框组件属性 */
export interface DialogueBoxProps {
  /** 当前对话 */
  dialogue: DialogueLine | null;
  /** 主题配置 */
  theme?: DialogueBoxTheme;
  /** 是否正在打字中 */
  isTyping?: boolean;
  /** 是否自动播放模式 */
  isAutoMode?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 跳过打字动画 */
  onSkipTyping?: () => void;
  /** 切换自动模式 */
  onToggleAuto?: () => void;
  /** 打开历史记录 */
  onOpenHistory?: () => void;
  /** 快进 */
  onSkip?: () => void;
  /** 重置相机 */
  onResetCamera?: () => void;
  /** 相机是否处于手动调整状态 */
  isCameraManual?: boolean;
  /** 是否显示控制按钮 */
  showControls?: boolean;
  /** 是否显示快进按钮 */
  showSkipButton?: boolean;
  /** 是否显示自动按钮 */
  showAutoButton?: boolean;
  /** 是否显示历史按钮 */
  showHistoryButton?: boolean;
  /** 样式 */
  className?: string;
}

/** 历史记录项 */
export interface DialogueHistoryItem {
  nodeIndex: number;
  dialogueIndex: number;
  speaker?: string;
  text: string;
  timestamp: number;
}

/** 视觉小说组件 Ref 接口 */
export interface MMDVisualNovelRef {
  /** 跳转到指定节点 */
  goToNode: (nodeIndex: number, force?: boolean) => void;
  /** 跳转到指定对话 */
  goToDialogue: (dialogueIndex: number) => void;
  /** 获取当前节点索引 */
  getCurrentNodeIndex: () => number;
  /** 获取当前对话索引 */
  getCurrentDialogueIndex: () => number;
  /** 获取对话历史 */
  getHistory: () => DialogueHistoryItem[];
  /** 获取当前剧情变量 */
  getVariables: () => Record<string, string | number | boolean>;
  /** 设置剧情变量 */
  setVariable: (key: string, value: string | number | boolean) => void;
  /** 设置自动播放模式 */
  setAutoMode: (enabled: boolean) => void;
  /** 跳过当前打字动画 */
  skipTyping: () => void;
}




