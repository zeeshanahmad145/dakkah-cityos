import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Healthcare",
  "basePath": "/admin/healthcare",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Test Practitioner",
    "specialization": "cardiology",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Practitioner"
  }
});
