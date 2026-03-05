import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Promotions Ext",
  "basePath": "/admin/promotions-ext",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "GC 1772667436466",
    "description": "Gift card",
    "code": "GC1772667436466",
    "initial_value": 100,
    "remaining_value": 100,
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Gift Card"
  }
});
