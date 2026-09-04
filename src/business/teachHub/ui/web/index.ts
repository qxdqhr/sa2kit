/**
 * teachHub Web UI — `sa2kit/business/teachHub/ui/web`
 *
 * 鉴权：TeachHubLayout 依赖 useAuthContext；宿主须用 AuthProvider 包裹。
 */

export { TeachHubLayout } from './layout/TeachHubLayout';
export { WorkspaceShell } from './layout/WorkspaceShell';

export {
  TeachHubHomePage,
  NewWorkspacePage,
  WorkspacePage,
  LessonPage,
  MissionPage,
  ReferencePage,
  RecordsPage,
  ResourcesPage,
  SettingsPage,
} from './pages';

export type * from './types';
export { LoginRegisterModals } from './LoginRegisterModals';
export type { LoginRegisterModalsProps } from './LoginRegisterModals';
