/**
 * SA2Kit
 * A modern, type-safe React utility library with cross-platform support
 *
 * Version: 0.3.0
 * Features: Logger, Utils, Storage, Hooks, File Upload, Data Export, i18n, Analytics, Music, Calendar
 */

// Logger
export * from './logger';

// AI
export * from './ai/ocr';
export * from './ai/background-removal';
export * from './ai/sentiment-analysis';
export * from './ai/text-generation';
export * from './ai/llm';

// Utils
export * from './utils';

// Components (Foundation UI)
export * from './components';

// Business Logic Components
export * from './profile';
export * from './portfolio';
export * from './navigation';
export * from './testField';
export * from './mikuFireworks3D';
export * from './screenReceiver';

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
