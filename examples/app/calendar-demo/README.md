# Calendar Demo API Notes

This demo now supports two modes for calendar APIs:

1. Factory mode (recommended)
- Uses `sa2kit/calendar/routes` handlers
- Requires `DATABASE_URL` so `examples/lib/db.ts` can provide a real db

2. Mock mode (fallback)
- Uses `examples/lib/calendar-mock-db.ts`
- Enabled automatically when `DATABASE_URL` is missing

Covered endpoints:
- `GET/POST /api/calendar/events`
- `GET/PUT/DELETE /api/calendar/events/[id]`
- `DELETE /api/calendar/events/batchDelete`
- `GET/PUT /api/calendar/config`
