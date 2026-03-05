import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Payment Terms",
  "basePath": "/admin/payment-terms",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Terms 1772666195974",
    "code": "PT-1772666195974",
    "net_days": 30,
    "early_payment_discount_days": 10
  },
  "updatePayload": {
    "name": "Updated Terms"
  }
});
