import { SearchResult } from '../types';
import { MusicSourceAdapter } from './types';

export const xiamiAdapter: MusicSourceAdapter = {
  parseSearchResult(data: any): SearchResult {
    const root = typeof data === 'string' ? JSON.parse(data) : data;
    // 虾米返回的结构（根据提供的数据，类似于网易云的结构）
    const result = root.data?.result || root.result || root;
    const songs = result.songs || (Array.isArray(root) ? root : []);
    
    return {
      tracks: songs.map((item: any) => ({
        id: item.id?.toString() || '',
        name: item.name || 'Unknown',
        artist: Array.isArray(item.ar) 
          ? item.ar.map((a: any) => a.name).join(', ') 
          : (item.artist || 'Unknown Artist'),
        album: item.al?.name || item.album || '',
        pic: item.al?.picUrl || item.pic || '',
        url: item.url,
        lrc: item.lrc,
        source: 'xiami',
        // 这里的逻辑参考提供的数据结构
        isVip: item.fee === 1 || item.fee === 8,
        playable: item.copyright !== 0,
      })),
      total: result.songCount || songs.length,
    };
  },

  parseGetSongUrl(data: any): any {
    const root = typeof data === 'string' ? JSON.parse(data) : data;
    // 兼容多种可能的包装结构
    const item = root.data?.[0] || root.data || root[0] || root;
    return item.url || null;
  },

  parseGetLyric(data: any): any {
    const root = typeof data === 'string' ? JSON.parse(data) : data;
    return root.lyric || root.lrc || root.data?.lyric || root.data || '';
  }
};

