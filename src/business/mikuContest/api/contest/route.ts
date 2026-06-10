import type { NextRequest } from 'next/server';
import {
  createGetContestSnapshotHandler,
  createUpdateContestConfigHandler,
} from '../../routes';
import {
  createDefaultMikuContestRouteConfig,
  withMikuContestDbGuard,
} from '../_shared';

const routeConfig = createDefaultMikuContestRouteConfig();
const getContestSnapshotHandler = createGetContestSnapshotHandler(routeConfig);
const updateContestConfigHandler = createUpdateContestConfigHandler(routeConfig);

export const GET = withMikuContestDbGuard((request: NextRequest) =>
  getContestSnapshotHandler(request),
);

export const PATCH = withMikuContestDbGuard((request: NextRequest) =>
  updateContestConfigHandler(request),
);
