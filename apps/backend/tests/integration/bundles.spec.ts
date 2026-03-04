import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Bundles",
  "basePath": "/admin/bundles",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Test Bundle 1772649864032",
    "bundle_type": "fixed",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Bundle"
  }
});
