import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Flash Sales",
  "basePath": "/admin/flash-sales",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Flash Sale 1772649864032",
    "discount_percent": 30,
    "start_time": "2026-03-04T18:44:24.043Z",
    "end_time": "2026-03-05T18:44:24.043Z",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Flash Sale"
  }
});
