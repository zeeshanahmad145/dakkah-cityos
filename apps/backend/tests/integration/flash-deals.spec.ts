import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Flash Deals",
  "basePath": "/admin/flash-deals",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Flash Deal 1772649864032",
    "discount_percent": 20,
    "start_time": "2026-03-04T18:44:24.043Z",
    "end_time": "2026-03-05T18:44:24.043Z",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Flash Deal"
  }
});
