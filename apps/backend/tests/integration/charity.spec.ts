import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Charity",
  "basePath": "/admin/charity",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "name": "Test Charity 2",
    "category": "health"
  },
  "updatePayload": {
    "name": "Updated Charity 2"
  }
});
