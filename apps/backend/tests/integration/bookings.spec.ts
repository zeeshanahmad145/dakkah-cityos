import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Bookings",
  "basePath": "/admin/bookings",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "customer_id": "cust-1772652757882",
    "start_time": "2026-04-01T10:00:00Z",
    "end_time": "2026-04-01T11:00:00Z",
    "tenant_id": "test-tenant-1",
    "status": "pending"
  },
  "updatePayload": {
    "status": "confirmed"
  }
});
