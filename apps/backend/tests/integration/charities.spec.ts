import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Charities",
  "basePath": "/admin/charities",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "name": "Test Charity",
    "category": "education"
  },
  "updatePayload": {
    "name": "Updated Charity"
  }
});
