import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Promotions Ext",
  "basePath": "/admin/promotions-ext",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "code": "GIFT-1772652757882",
    "amount": 50,
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1",
    "gift_card_type": "digital"
  },
  "updatePayload": {
    "amount": 60
  }
});
