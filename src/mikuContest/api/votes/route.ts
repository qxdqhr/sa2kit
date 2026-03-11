import type { NextRequest } from 'next/server';
import { createVoteHandler } from '../../routes';
import {
  createDefaultMikuContestRouteConfig,
  withMikuContestDbGuard,
} from '../_shared';

const routeConfig = createDefaultMikuContestRouteConfig();
const voteHandler = createVoteHandler(routeConfig);

export const POST = withMikuContestDbGuard((request: NextRequest) =>
  voteHandler(request),
);
