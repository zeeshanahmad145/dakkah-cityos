import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "B2B",
  "basePath": "/admin/b2b",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "handle": "b2b-1772652757882",
    "name": "Test B2B 1772652757882",
    "email": "b2b1772652757882@test.com",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated B2B"
  }
});
