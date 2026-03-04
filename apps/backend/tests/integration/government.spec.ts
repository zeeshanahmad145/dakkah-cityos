import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Government",
  "basePath": "/admin/government",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "citizen_id": "cit-45524914",
    "request_type": "permit",
    "title": "Test Government Request",
    "description": "Test description",
    "reference_number": "REF-45524914"
  },
  "updatePayload": {
    "title": "Updated Government Request"
  }
});
