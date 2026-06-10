import type { MikuFusionContentRegistry } from './types';

export type * from './types';

/**
 * 仅作为未来内容包化扩展占位。
 * 当前基础玩法不会消费这些数据。
 */
export const defaultContentRegistry: MikuFusionContentRegistry = {
  producers: [],
  songs: [],
  themes: [],
};

