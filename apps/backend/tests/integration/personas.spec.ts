import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Personas",
  "basePath": "/admin/personas",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Persona 1772652757882",
    "handle": "persona-1772652757882",
    "type": "buyer",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Persona"
  }
});
