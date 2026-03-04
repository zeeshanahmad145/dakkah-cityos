import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "B2B",
  "basePath": "/admin/b2b",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Test B2B 1772649864032",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated B2B"
  }
});
