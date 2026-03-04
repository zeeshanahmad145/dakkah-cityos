import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Flash Sales",
  "basePath": "/admin/flash-sales",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Flash Sale 1772652757882",
    "discount_percent": 30,
    "start_time": "2026-04-01T00:00:00Z",
    "end_time": "2026-04-02T00:00:00Z",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Flash Sale"
  }
});
