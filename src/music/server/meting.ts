import Meting from '@meting/core';
import { SearchOptions } from '../types';
import { DEFAULT_MUSIC_SOURCE } from '../constants';

/**
 * Meting 服务集成
 */
export class MetingService {
  private instances: Map<string, any> = new Map();

  private getInstance(source: string) {
    if (!this.instances.has(source)) {
      this.instances.set(source, new Meting(source));
    }
    return this.instances.get(source);
  }

  /**
   * 搜索歌曲
   */
  async search(options: SearchOptions): Promise<any> {
    const { keyword, source = DEFAULT_MUSIC_SOURCE, limit = 20, offset = 0 } = options;
    const meting = this.getInstance(source);
    
    // Meting 通常使用 page (1-based) 和 limit 参数
    // 如果 offset 是前端传来的 0-based 页码
    const response = await meting.search(keyword, {
      limit,
      page: offset + 1,
    });

    try {
      return typeof response === 'string' ? JSON.parse(response) : response;
    } catch (e) {
      return response;
    }
  }

  /**
   * 获取歌曲详情（包含播放链接）
   */
  async getSongUrl(id: string, source: string = DEFAULT_MUSIC_SOURCE): Promise<any | undefined> {
    const meting = this.getInstance(source);
    const response = await meting.song(id);
    try {
      return typeof response === 'string' ? JSON.parse(response) : response;
    } catch (e) {
      return response;
    }
  }

  /**
   * 获取歌词
   */
  async getLyric(id: string, source: string = DEFAULT_MUSIC_SOURCE): Promise<any | undefined> {
    const meting = this.getInstance(source);
    const response = await meting.lyric(id);
    try {
      return typeof response === 'string' ? JSON.parse(response) : response;
    } catch (e) {
      return response;
    }
  }
}

export const musicService = new MetingService();
