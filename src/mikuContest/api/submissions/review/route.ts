import type { NextRequest } from 'next/server';
import { createReviewSubmissionHandler } from '../../../routes';
import {
  createDefaultMikuContestRouteConfig,
  withMikuContestDbGuard,
} from '../../_shared';

const routeConfig = createDefaultMikuContestRouteConfig();
const reviewSubmissionHandler = createReviewSubmissionHandler(routeConfig);

export const POST = withMikuContestDbGuard((request: NextRequest) =>
  reviewSubmissionHandler(request),
);
