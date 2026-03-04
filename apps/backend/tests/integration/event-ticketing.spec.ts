import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Event Ticketing",
  "basePath": "/admin/event-ticketing",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "title": "Test Event",
    "event_type": "conference",
    "status": "draft",
    "starts_at": "2026-04-03T17:14:01.697Z",
    "ends_at": "2026-04-04T17:14:01.697Z"
  },
  "updatePayload": {
    "title": "Updated Event",
    "status": "published"
  }
});
