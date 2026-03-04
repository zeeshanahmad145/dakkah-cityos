import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Payment Terms",
  "basePath": "/admin/payment-terms",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Net 30",
    "code": "NET30-45138994",
    "net_days": 30,
    "is_default": false,
    "is_active": true
  },
  "updatePayload": {
    "name": "Net 45",
    "net_days": 45
  }
});
