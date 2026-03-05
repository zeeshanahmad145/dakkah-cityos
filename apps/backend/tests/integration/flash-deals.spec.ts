import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Flash Deals",
  "basePath": "/admin/flash-deals",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "code": "FD1772667436466",
    "initial_value": 100,
    "remaining_value": 100,
    "currency_code": "SAR",
    "is_active": true
  },
  "updatePayload": {
    "is_active": false
  }
});
