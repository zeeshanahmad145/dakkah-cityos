import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Company",
  "basePath": "/admin/company",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Co 1772666195974",
    "customer_id": "c-1772666195974",
    "email": "c1772666195974@test.com"
  },
  "updatePayload": {
    "name": "Updated Company"
  }
});
