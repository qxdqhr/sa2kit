'use client';

/**
 * showmasterpiece Web UI — sa2kit/business/showmasterpiece/ui/web (SMP2)
 * 鉴权：页面依赖 useAuthContext / AuthGuard；宿主须用 AuthProvider 包裹。
 */

export { default as ShowMasterPiecesPage } from './pages/ShowMasterPiecesPage';
export type { ShowMasterPiecesPageProps } from './pages/ShowMasterPiecesPage';
export { default as ShowMasterPiecesConfigPage } from './pages/config/page';
export { default as ShowMasterPiecesHistoryPage } from './pages/history/page';

export * from './client';
