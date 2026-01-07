import { MetingService, musicService } from './meting';
import { SearchOptions, SearchResult } from '../types';
import { DEFAULT_MUSIC_SOURCE } from '../constants';

/**
 * 专门用于搜索 Miku/初音未来 相关歌曲的服务
 */
export class MikuMusicService {
  private baseService: MetingService;
  private mikuKeywords = ['初音未来', 'Miku', 'Vocaloid', 'MIKU'];

  constructor(baseService: MetingService = musicService) {
    this.baseService = baseService;
  }

  /**
   * 搜索歌曲，自动增加 Miku 相关关键词
   */
  async search(options: SearchOptions): Promise<any> {
    const { keyword, source = DEFAULT_MUSIC_SOURCE, limit = 20, offset = 0 } = options;
    
    const trimmedKeyword = keyword.trim();
    
    // 如果关键词中已经包含了 miku 相关词，就不再额外添加
    const hasMikuKeyword = this.mikuKeywords.some(k => 
      trimmedKeyword.toLowerCase().includes(k.toLowerCase())
    );

    // 组合关键词：用户关键词 + 初音未来
    // 如果用户没搜初音，我们就帮他搜初音
    const mikuKeyword = hasMikuKeyword ? trimmedKeyword : `${trimmedKeyword} 初音未来`.trim();

    return this.baseService.search({
      ...options,
      keyword: mikuKeyword || '初音未来', // 如果输入为空，默认搜初音未来
    });
  }

  /**
   * 获取歌曲详情（包含播放链接）- 直接透传
   */
  async getSongUrl(id: string, source: string = DEFAULT_MUSIC_SOURCE): Promise<any | undefined> {
    return this.baseService.getSongUrl(id, source);
  }

  /**
   * 获取歌词 - 直接透传
   */
  async getLyric(id: string, source: string = DEFAULT_MUSIC_SOURCE): Promise<any | undefined> {
    return this.baseService.getLyric(id, source);
  }
}

export const mikuMusicService = new MikuMusicService();







