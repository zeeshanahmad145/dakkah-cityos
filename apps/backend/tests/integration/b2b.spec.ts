import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "B2B",
  "basePath": "/admin/b2b",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "handle": "b2b-1772654359049",
    "name": "Test B2B 1772654359049",
    "email": "b2b1772654359049@test.com",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated B2B"
  }
});
