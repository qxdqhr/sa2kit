import { SearchResult } from '../types';

export interface MusicSourceAdapter {
  parseSearchResult(data: any): SearchResult;
  parseGetSongUrl(data: any): string | null;
  parseGetLyric(data: any): any;
}

