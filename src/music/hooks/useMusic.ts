import useSWR from 'swr';
import { useState, useCallback, useMemo } from 'react';
import { MusicTrack, SearchOptions, SearchResult, MusicApiResponse } from '../types';
import { DEFAULT_MUSIC_SOURCE } from '../constants';
import { 
  kugouAdapter, 
  neteaseAdapter, 
  tencentAdapter, 
  xiamiAdapter,
  MusicSourceAdapter 
} from '../adapters';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const ADAPTERS: Record<string, MusicSourceAdapter> = {
  kugou: kugouAdapter,
  netease: neteaseAdapter,
  tencent: tencentAdapter,
  xiami: xiamiAdapter,
};

export function useMusic() {
  const [searchOptions, setSearchOptions] = useState<SearchOptions | null>(null);

  // 搜索歌曲
  const { data: rawData, error: searchError, isLoading: isSearching } = useSWR<MusicApiResponse<any>>(
    searchOptions ? `/api/music/search?keyword=${encodeURIComponent(searchOptions.keyword)}&source=${searchOptions.source || DEFAULT_MUSIC_SOURCE}&limit=${searchOptions.limit || 20}&offset=${searchOptions.offset || 0}${searchOptions.miku ? '&miku=true' : ''}` : null,
    fetcher
  );

  const searchResult = useMemo(() => {
    if (!rawData?.data || !searchOptions) return undefined;
    const adapter = ADAPTERS[searchOptions.source || DEFAULT_MUSIC_SOURCE];
    if (adapter) {
      return adapter.parseSearchResult(rawData.data);
    }
    return undefined;
  }, [rawData, searchOptions]);

  const search = useCallback((options: SearchOptions) => {
    setSearchOptions(options);
  }, []);

  // 获取播放链接
  const getSongUrl = useCallback(async (id: string, source: string = DEFAULT_MUSIC_SOURCE): Promise<string | undefined> => {
    try {
      const res = await fetch(`/api/music/url?id=${id}&source=${source}`);
      const json: MusicApiResponse<any> = await res.json();
      const adapter = ADAPTERS[source];
      console.log('json2', json.data,source,adapter);
      if (adapter && json.data) {
        console.log('getSongUrl2', json.data);
        return adapter.parseGetSongUrl(json.data) || undefined;
      }
      return json.data?.url;
    } catch (err) {
      console.error('[Music] Failed to get song URL:', err);
      return undefined;
    }
  }, []);

  // 获取歌词
  const getLyric = useCallback(async (id: string, source: string = DEFAULT_MUSIC_SOURCE): Promise<string | undefined> => {
    try {
      const res = await fetch(`/api/music/lyric?id=${id}&source=${source}`);
      const json: MusicApiResponse<any> = await res.json();
      const adapter = ADAPTERS[source];
      if (adapter && json.data) {
        return adapter.parseGetLyric(json.data);
      }
      return json.data?.lyric;
    } catch (err) {
      console.error('[Music] Failed to get lyric:', err);
      return undefined;
    }
  }, []);

  return {
    search,
    searchResult,
    isSearching,
    searchError,
    getSongUrl,
    getLyric,
  };
}

