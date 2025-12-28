/**
 * SA2Kit
 * A modern, type-safe React utility library with cross-platform support
 *
 * Version: 0.3.0
 * Features: Logger, Utils, Storage, Hooks, File Upload, Data Export, i18n, Analytics, Music, Calendar
 *
 */

// Logger
export * from './logger';

// AI
export * from './ai/ocr';
export * from './ai/background-removal';
export * from './ai/sentiment-analysis';
export * from './ai/text-generation';

// Utils
export * from './utils';

// Components
export * from './components';

/// Profile Feature
export { ProfileButton } from './profile/ProfileButton';
export type { ProfileButtonProps } from './profile/ProfileButton';
export { ProfileModal } from './profile/ProfileModal';
export type { ProfileModalProps } from './profile/ProfileModal';
export { AutoOpenModal } from './profile/AutoOpenModal';
export type { AutoOpenModalProps } from './profile/AutoOpenModal';
export { EnhancedAvatar } from './profile/EnhancedAvatar';
export type { EnhancedAvatarProps } from './profile/EnhancedAvatar';
export * from './profile/types';

// Portfolio Feature
export { default as About } from './portfolio/About';
export { default as Contact } from './portfolio/Contact';
export { default as Home } from './portfolio/Home';
export type { HomeConfig } from './portfolio/Home';
export { ExperimentCard } from './portfolio/ExperimentCard';
export type { ExperimentCardProps } from './portfolio/ExperimentCard';
export { ProjectCarousel } from './portfolio/ProjectCarousel';
export type { Project, ProjectsConfig } from './portfolio/ProjectCarousel';

// Navigation Feature
export { default as Navigation } from './navigation/Navigation';
export { default as NavigationItem } from './navigation/NavigationItem';
export { default as NavigationToggle } from './navigation/NavigationToggle';
export { default as FloatingMenu } from './navigation/FloatingMenu';
export { default as FloatingMenuExample } from './navigation/FloatingMenuExample';
export * from './navigation/types';

// Storage - Only export types and hooks, not platform adapters
// Platform adapters should be imported from '@qhr123/sa2kit/storage' subpath
export type { StorageAdapter, StorageChangeEvent } from './storage/types';
export * from './storage/hooks';

// Note: The following modules are available as separate subpath exports
// to avoid naming conflicts and reduce bundle size. Import them directly:
// - File Management: import { universalFileClient } from '@qhr123/sa2kit/universalFile';
// - Data Export: import { universalExportClient } from '@qhr123/sa2kit/universalExport';
// - Internationalization: import { createI18n, useTranslation } from '@qhr123/sa2kit/i18n';
// - Analytics: import { Analytics } from '@qhr123/sa2kit/analytics';
// - Music: import { MusicPlayer, musicService } from '@qhr123/sa2kit/music';
// - Calendar: import { useEvents, CalendarPage } from '@qhr123/sa2kit/calendar';


