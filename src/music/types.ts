/**
 * 音乐模块类型定义
 */

import { MusicSource } from './constants';

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  album?: string;
  pic?: string;
  url?: string;
  lrc?: string;
  source: MusicSource;
  isVip?: boolean;
  playable?: boolean;
}

export interface SearchOptions {
  keyword: string;
  source?: MusicSource;
  limit?: number;
  offset?: number;
  miku?: boolean;
}

export interface SearchResult {
  tracks: MusicTrack[];
  total: number;
}

export interface MusicApiResponse<T = any> {
  code: number;
  data?: T;
  message?: string;
}

