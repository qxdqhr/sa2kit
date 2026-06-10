export * from './types';

// 导出PMX工具
export * from './pmx';
export * from './components/MMDPlayerBase';
export * from './components/MMDPlayerEnhanced';
export * from './components/MMDPlaylist';
export * from './components/MMDPlayerEnhancedDebugInfo';
export * from './components/MMDPlaylistDebugInfo';
export * from './components/MMDLightingDebugPanel';
export * from './components/MMDUploadPanel';
export * from './utils/ammo-loader';
export * from './utils/mmd-loader-config';
export * from './utils/mmd-renderer-diagnostics';
export * from './utils/sphere-texture-helper';
export * from './visual-novel';
export * from './music-player';
export * from './ar/MMDARPlayer';
export * from './ar/MMDARApp';
export * from './ar/types';

// Explicitly export AR types
export type { 
  MMDARPlayerProps, 
  MMDARPlayerRef,
  ModelPreset,
  MotionPreset,
  AudioPreset
} from './ar/types';

// Export AR mode enum
export { ARMode } from './ar/types';
export * from './fx';

// Explicitly export visual novel types to ensure they are found by TS
export type { 
  VisualNovelScript, 
  VisualNovelNode, 
  DialogueLine, 
  DialogueChoice, 
  DialogueBoxTheme,
  VisualEffect,
  BranchCondition,
  DialogueBoxProps,
  DialogueHistoryItem,
  MMDVisualNovelProps,
  MMDVisualNovelRef
} from './visual-novel/types';

// Export model selector types
export type {
  ModelOption,
  ModelSelectorSettingsProps
} from './visual-novel/ModelSelectorSettings';

export type {
  ModelSelectorConfig,
  MMDVisualNovelWithSelectorProps,
  MMDVisualNovelWithSelectorRef
} from './visual-novel/MMDVisualNovelWithSelector';
