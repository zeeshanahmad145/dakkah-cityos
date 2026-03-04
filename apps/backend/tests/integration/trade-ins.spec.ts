import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Trade Ins",
  "basePath": "/admin/trade-ins",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "customer_id": "cust-1772649864032",
    "title": "Trade In 1772649864032",
    "condition": "good",
    "estimated_value": 200
  },
  "updatePayload": {
    "title": "Updated Trade In"
  }
});
