import type { NextRequest } from 'next/server';
import { createResetVotesHandler } from '../../../../routes';
import {
  createDefaultMikuContestRouteConfig,
  withMikuContestDbGuard,
} from '../../../_shared';

const routeConfig = createDefaultMikuContestRouteConfig();
const resetVotesHandler = createResetVotesHandler(routeConfig);

export const POST = withMikuContestDbGuard((request: NextRequest) =>
  resetVotesHandler(request),
);
