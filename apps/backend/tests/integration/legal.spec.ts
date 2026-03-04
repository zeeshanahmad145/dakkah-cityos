import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Legal",
  "basePath": "/admin/legal",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "name": "Test Legal Document"
  },
  "updatePayload": {
    "name": "Updated Legal Document"
  }
});
