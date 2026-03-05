import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Charity",
  "basePath": "/admin/charity",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Charity 1772666195974",
    "category": "education",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Charity"
  }
});
