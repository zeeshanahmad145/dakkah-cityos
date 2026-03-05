import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Trade Ins",
  "basePath": "/admin/trade-ins",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "Trade 1772672118495",
    "customer_id": "c-1772672118495",
    "trade_in_number": "TI1772672118495",
    "description": "Good condition",
    "condition": "good",
    "estimated_value": 200,
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1",
    "product_id": "prod-1772672118495"
  },
  "updatePayload": {
    "title": "Updated Trade In"
  }
});
