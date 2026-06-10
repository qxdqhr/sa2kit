import { SearchResult } from '../types';
import { MusicSourceAdapter } from './types';

export const neteaseAdapter: MusicSourceAdapter = {
  parseSearchResult(data: any): SearchResult {
    const root = typeof data === 'string' ? JSON.parse(data) : data;
    const songs = root.result?.songs || root.songs || (Array.isArray(root) ? root : []);
    
    return {
      tracks: songs.map((item: any) => ({
        id: item.id,
        name: item.name,
        artist: Array.isArray(item.artist) ? item.artist.join(', ') : item.artist,
        album: item.album?.name || item.album,
        pic: item.pic || item.album?.picUrl,
        url: item.url,
        lrc: item.lrc,
        source: 'netease',
        isVip: item.fee === 1 || item.fee === 4,
        playable: item.noCopyrightRcmd === null,
      })),
      total: root.result?.songCount || songs.length,
    };
  },

  parseGetSongUrl(data: any): any {
    const root = typeof data === 'string' ? JSON.parse(data) : data;
    const item = root.data?.[0] || root[0] || root;
    return item.url || null;
  },

  parseGetLyric(data: any): any {
    const root = typeof data === 'string' ? JSON.parse(data) : data;
    return root.lyric || root.lrc || root.data?.lyric || '';
  }
};

