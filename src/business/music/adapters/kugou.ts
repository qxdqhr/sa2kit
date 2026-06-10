import { SearchResult } from '../types';
import { MusicSourceAdapter } from './types';

export const kugouAdapter: MusicSourceAdapter = {
  parseSearchResult(data: any): SearchResult {
    const root = typeof data === 'string' ? JSON.parse(data) : data;
    const info = root.data?.data?.info || root.data?.info || root.info || [];
    const total = root.data?.data?.total || root.data?.total || info.length;
    return {
      tracks: info.map((item: any) => {
        // 优先从 trans_param.union_cover 提取封面，并替换 {size} 为 400
        let pic = item.pic || '';
        if (item.trans_param?.union_cover) {
          pic = item.trans_param.union_cover.replace('{size}', '400');
        }

        return {
          id: item.hash || item.id,
          name: item.songname || item.filename || 'Unknown',
          artist: item.singername || 'Unknown Artist',
          album: item.album_name || item.album || '',
          pic: pic,
          url: item.url,
          lrc: item.lrc,
          source: 'kugou',
          isVip: item.privilege >= 8,
          playable: item.status !== 0,
        };
      }),
      total: total,
    };
  },

  parseGetSongUrl(data: any): string | null {
    return data.url?.url || data.url?.backup_url?.[0] || null;
  },

  parseGetLyric(data: any): any {
    const root = typeof data === 'string' ? JSON.parse(data) : data;
    return root.lyric || root.lrc || root.data?.lyric || root.data || '';
  }
};
