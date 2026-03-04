import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Bundles",
  "basePath": "/admin/bundles",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Bundle 1772654359049",
    "title": "Bundle 1772654359049",
    "handle": "bundle-1772654359049",
    "bundle_type": "fixed",
    "discount_type": "percentage",
    "discount_value": 10,
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Bundle"
  }
});
