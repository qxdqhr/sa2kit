export * from './types';
export * from './components/MMDPlayerBase';
export * from './components/MMDPlayerEnhanced';
export * from './components/MMDPlaylist';
export * from './components/MMDPlayerEnhancedDebugInfo';
export * from './components/MMDPlaylistDebugInfo';
export * from './utils/ammo-loader';
export * from './visual-novel';
export * from './music-player';
export * from './ar/MMDARPlayer';
export * from './ar/types';
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
