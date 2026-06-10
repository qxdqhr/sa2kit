import type { FestivalCardConfig, FestivalCardDbAdapter } from '../../types';
import { FestivalCardDbService } from './festivalCardDbService';
import type { DrizzleLikeDb } from './festivalCardDbService';

export type { DrizzleLikeDb } from './festivalCardDbService';

export const createFestivalCardDrizzleDbAdapter = (db: DrizzleLikeDb): FestivalCardDbAdapter => {
  const service = new FestivalCardDbService(db);

  return {
    listConfigs: () => service.listConfigs(),
    getConfig: (id: string) => service.getConfig(id),
    saveConfig: (id: string, config: FestivalCardConfig) => service.saveConfig(id, config),
    deleteConfig: (id: string) => service.deleteConfig(id),
  };
};
