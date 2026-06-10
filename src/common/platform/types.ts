import type { RequestAdapter } from '../request/types/types';
import type { StorageAdapter } from '../storage/types';

/** 用户选择的文件（跨平台最小公共形态） */
export type PickedFile = {
  name: string;
  mimeType?: string;
  size?: number;
  /** Web / Electron 等可提供 Blob；小程序等由宿主自行映射 */
  blob?: Blob;
};

export type FilePickOptions = {
  /** 是否允许多选 */
  multiple?: boolean;
  /** 接受的 MIME，如 `image/*` */
  accept?: string;
};

/** 文件选择抽象（各平台实现差异大，可选能力） */
export interface FilePickAdapter {
  pickFiles(options?: FilePickOptions): Promise<PickedFile[]>;
}

/**
 * 跨平台运行时适配器（R2-221）
 *
 * 聚合 storage / fetch / filePick，供 ossFile、auth 等 common 模块注入。
 */
export interface PlatformAdapter {
  storage: StorageAdapter;
  fetch: RequestAdapter;
  filePick?: FilePickAdapter;
}

export type PlatformId = 'web' | 'taro' | 'electron' | 'node-hono';
