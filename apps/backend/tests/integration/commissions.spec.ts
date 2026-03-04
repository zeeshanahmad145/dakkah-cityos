import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Commissions",
  "basePath": "/admin/commissions",
  "entityKey": "rule",
  "listKey": "commissions",
  "createPayload": {
    "name": "Test Commission",
    "type": "percentage",
    "rate": 15,
    "is_active": true
  },
  "updatePayload": {
    "name": "Updated Commission"
  }
});
