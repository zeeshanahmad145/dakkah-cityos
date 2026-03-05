import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Bundles",
  "basePath": "/admin/bundles",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Bundle 1772666195974",
    "title": "Bundle 1772666195974",
    "handle": "bnd-1772666195974",
    "bundle_type": "fixed",
    "discount_type": "percentage",
    "discount_value": 10,
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Bundle"
  }
});
