import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Vendors",
  "basePath": "/admin/vendors",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Vendor 1772666195974",
    "handle": "vnd-1772666195974",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Vendor"
  }
});
