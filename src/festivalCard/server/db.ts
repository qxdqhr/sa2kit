import type { FestivalCardDbAdapter } from '../types';

let dbAdapter: FestivalCardDbAdapter | null = null;

export const initializeFestivalCardDb = (adapter: FestivalCardDbAdapter): void => {
  dbAdapter = adapter;
};

export const getFestivalCardDb = (): FestivalCardDbAdapter | null => dbAdapter;
