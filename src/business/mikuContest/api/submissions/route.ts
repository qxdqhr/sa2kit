import type { NextRequest } from 'next/server';
import {
  createCreateSubmissionHandler,
  createListSubmissionsHandler,
} from '../../routes';
import {
  createDefaultMikuContestRouteConfig,
  withMikuContestDbGuard,
} from '../_shared';

const routeConfig = createDefaultMikuContestRouteConfig();
const createSubmissionHandler = createCreateSubmissionHandler(routeConfig);
const listSubmissionsHandler = createListSubmissionsHandler(routeConfig);

export const GET = withMikuContestDbGuard((request: NextRequest) =>
  listSubmissionsHandler(request),
);

export const POST = withMikuContestDbGuard((request: NextRequest) =>
  createSubmissionHandler(request),
);
