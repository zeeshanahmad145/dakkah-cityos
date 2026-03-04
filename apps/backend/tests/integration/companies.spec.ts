import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Companies",
  "basePath": "/admin/companies",
  "entityKey": "company",
  "listKey": "items",
  "createPayload": {
    "name": "Test Company 44441689",
    "email": "company-44441689@example.com",
    "customer_id": "cust-44441689"
  },
  "updatePayload": {
    "name": "Updated Company"
  }
});
