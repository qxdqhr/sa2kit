import { musicService } from './meting';
import { mikuMusicService } from './miku';
import { MusicApiResponse } from '../types';
import { DEFAULT_MUSIC_SOURCE } from '../constants';

/**
 * 创建搜索接口处理器
 */
export const createSearchHandler = () => {
// ...
  return async (req: Request): Promise<Response> => {
    try {
      const { searchParams } = new URL(req.url);
      const keyword = searchParams.get('keyword');
      const source = searchParams.get('source') || DEFAULT_MUSIC_SOURCE;
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');
      const miku = searchParams.get('miku') === 'true';

      if (!keyword && !miku) {
        return Response.json({ code: 400, message: 'Keyword is required' }, { status: 400 });
      }

      const service = miku ? mikuMusicService : musicService;
      const result = await service.search({
        keyword: keyword || '',
        source: source as any,
        limit,
        offset,
        miku,
      });

      return Response.json({
        code: 200,
        data: result,
      });
    } catch (error: any) {
      console.error('[Music] Search error:', error);
      return Response.json({
        code: 500,
        message: error.message || 'Internal Server Error',
      }, { status: 500 });
    }
  };
};

/**
 * 创建歌曲链接接口处理器
 */
export const createSongUrlHandler = () => {
  return async (req: Request): Promise<Response> => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      const source = searchParams.get('source') || DEFAULT_MUSIC_SOURCE;

      if (!id) {
        return Response.json({ code: 400, message: 'ID is required' }, { status: 400 });
      }

      const url = await musicService.getSongUrl(id, source);

      return Response.json({
        code: 200,
        data: { url },
      });
    } catch (error: any) {
      console.error('[Music] Get URL error:', error);
      return Response.json({
        code: 500,
        message: error.message || 'Internal Server Error',
      }, { status: 500 });
    }
  };
};

/**
 * 创建歌词接口处理器
 */
export const createLyricHandler = () => {
  return async (req: Request): Promise<Response> => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      const source = searchParams.get('source') || DEFAULT_MUSIC_SOURCE;

      if (!id) {
        return Response.json({ code: 400, message: 'ID is required' }, { status: 400 });
      }

      const lyric = await musicService.getLyric(id, source);

      return Response.json({
        code: 200,
        data: { lyric },
      });
    } catch (error: any) {
      console.error('[Music] Get lyric error:', error);
      return Response.json({
        code: 500,
        message: error.message || 'Internal Server Error',
      }, { status: 500 });
    }
  };
};

