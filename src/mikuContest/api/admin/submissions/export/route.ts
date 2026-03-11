import type { NextRequest } from 'next/server';
import { createExportSubmissionsHandler } from '../../../../routes';
import {
  createDefaultMikuContestRouteConfig,
  withMikuContestDbGuard,
} from '../../../_shared';

const routeConfig = createDefaultMikuContestRouteConfig();
const exportSubmissionsHandler = createExportSubmissionsHandler(routeConfig);

export const GET = withMikuContestDbGuard((request: NextRequest) =>
  exportSubmissionsHandler(request),
);
