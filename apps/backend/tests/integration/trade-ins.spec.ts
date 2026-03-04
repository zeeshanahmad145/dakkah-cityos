import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Trade Ins",
  "basePath": "/admin/trade-ins",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "customer_id": "cust-1772652757882",
    "title": "Trade 1772652757882",
    "condition": "good",
    "estimated_value": 200,
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "title": "Updated Trade In"
  }
});
