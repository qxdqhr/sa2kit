import { createCalendarEventByIdRouteHandlers } from '../../route-handlers';

const { GET, PUT, DELETE } = createCalendarEventByIdRouteHandlers();
export { GET, PUT, DELETE };
