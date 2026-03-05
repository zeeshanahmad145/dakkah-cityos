import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Commissions",
  "basePath": "/admin/commissions",
  "entityKey": "rule",
  "listKey": "rules",
  "createPayload": {
    "name": "Com 1772667436466",
    "type": "percentage",
    "rate": 10
  },
  "updatePayload": {
    "name": "Updated Commission"
  }
});
