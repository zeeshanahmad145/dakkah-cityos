import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Promotions Ext",
  "basePath": "/admin/promotions-ext",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "code": "GIFT1772649864032",
    "tenant_id": "test-tenant-1",
    "amount": 50,
    "currency_code": "SAR"
  },
  "updatePayload": {
    "amount": 60
  }
});
