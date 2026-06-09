/**
 * @package sa2kit/common
 *
 * SA2Kit 2.0 通用层入口：供 Web / Taro / Electron / Hono 等复用。
 */
export * as logger from './logger';
export * as utils from './utils';
export * as storage from './storage';
export * as request from './request';
export * as file from './file';
export * as dataExport from './export';
export * as auth from './auth';
export * as platform from './platform';
export * as i18n from '../i18n';
export * as analytics from '../analytics';
export * as config from '../config';
export * as api from '../api';

/** 文件 SSOT 快捷导出 */
export * from './file';
