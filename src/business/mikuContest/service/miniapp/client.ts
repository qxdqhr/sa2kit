import { createMikuContestApiClient, type Requester } from '../api';

export interface MikuContestMiniappClientOptions {
  basePath?: string;
  requester: Requester;
}

export const createMikuContestMiniappClient = (options: MikuContestMiniappClientOptions) => {
  const basePath = options.basePath || '/api/miku-contest';
  return createMikuContestApiClient(basePath, options.requester);
};
