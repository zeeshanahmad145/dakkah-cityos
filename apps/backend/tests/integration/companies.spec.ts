import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Companies",
  "basePath": "/admin/companies",
  "entityKey": "company",
  "listKey": "companies",
  "createPayload": {
    "name": "Company 1772666195974",
    "handle": "co-1772666195974",
    "tenant_id": "test-tenant-1",
    "email": "co1772666195974@test.com"
  },
  "updatePayload": {
    "name": "Updated Company"
  }
});
