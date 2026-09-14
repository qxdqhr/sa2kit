'use client';

/**
 * cardMaker Web UI — `sa2kit/business/cardMaker/ui/web`
 * 鉴权：页面使用 AuthGuard；宿主须用 AuthProvider（`@profile/auth/react`）包裹。
 */

export { default as CardMakerPage } from './pages/CardMakerPage';
export { CharacterDisplay } from './components/CharacterDisplay';
export { ActionButtons } from './components/ActionButtons';
export { TabNavigation } from './components/TabNavigation';
export { AssetGrid } from './components/AssetGrid';
export { useCardMaker } from './hooks/useCardMaker';
export { CardMakerService } from './services/cardMakerService';
