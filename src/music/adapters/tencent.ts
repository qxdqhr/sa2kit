import { SearchResult } from '../types';
import { MusicSourceAdapter } from './types';

export const tencentAdapter: MusicSourceAdapter = {
  parseSearchResult(data: any): SearchResult {
    const root = typeof data === 'string' ? JSON.parse(data) : data;
    
    // 兼容多种 QQ 音乐返回结构
    const songData = root.data?.data?.song || root.data?.song || root.data || root;
    const list = songData.list || root.songs || [];
    const total = songData.totalnum || root.total || list.length;
    
    return {
      tracks: list.map((item: any) => {
        // 解析歌手名
        const artist = Array.isArray(item.singer) 
          ? item.singer.map((s: any) => s.name).join(', ') 
          : (item.singer?.[0]?.name || item.artist || 'Unknown');

        // 处理封面图 (QQ 音乐封面通常基于 album mid)
        let pic = item.pic;
        if (!pic && item.album?.mid) {
          pic = `https://y.gtimg.cn/music/photo_new/T002R300x300M000${item.album.mid}.jpg`;
        }

        return {
          id: item.mid || item.id || item.songid,
          name: item.name || item.title || item.songname,
          artist: artist,
          album: item.album?.name || item.albumname || item.album,
          pic: pic || '',
          url: item.url,
          lrc: item.lrc,
          source: 'tencent',
          isVip: item.pay?.pay_play === 1,
          playable: item.action?.switch !== 0,
        };
      }),
      total: total,
    };
  },

  parseGetSongUrl(data: any): string | null {

    const root =  data

    const urlData = root.url.url;
    let finalUrl = Object.values(urlData)[0] as string;
      console.log('finalUrl2', finalUrl);
    return finalUrl.startsWith('http') ? finalUrl : `http://${finalUrl}`;
  },

  parseGetLyric(data: any): any {
    const root = typeof data === 'string' ? JSON.parse(data) : data;
    return root.lyric || root.lrc || root.data?.lyric || '';
  }
};

