import type { NextRequest } from 'next/server';
import { createSetVoterRestrictionHandler } from '../../../routes';
import {
  createDefaultMikuContestRouteConfig,
  withMikuContestDbGuard,
} from '../../_shared';

const routeConfig = createDefaultMikuContestRouteConfig();
const setVoterRestrictionHandler = createSetVoterRestrictionHandler(routeConfig);

export const POST = withMikuContestDbGuard((request: NextRequest) =>
  setVoterRestrictionHandler(request),
);
