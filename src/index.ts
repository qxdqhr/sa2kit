/**
 * SA2Kit
 * A modern, type-safe React utility library with cross-platform support
 *
 * Version: 0.3.0
 * Features: Logger, Utils, Storage, Hooks, File Upload, Data Export, i18n, Analytics
 *
 * Note: Import the following modules using subpath exports:
 * - import { ... } from '@qhr123/sa2kit/universalFile'
 * - import { ... } from '@qhr123/sa2kit/universalExport'
 * - import { ... } from '@qhr123/sa2kit/i18n'
 * - import { ... } from '@qhr123/sa2kit/analytics'
 */

// Logger
export * from './logger';

// Utils
export * from './utils';

// Storage
export * from './storage';

// Note: The following modules are available as separate subpath exports
// to avoid naming conflicts and reduce bundle size. Import them directly:
// - File Management: import { universalFileClient } from '@qhr123/sa2kit/universalFile';
// - Data Export: import { universalExportClient } from '@qhr123/sa2kit/universalExport';
// - Internationalization: import { createI18n, useTranslation } from '@qhr123/sa2kit/i18n';
// - Analytics: import { Analytics } from '@qhr123/sa2kit/analytics';

