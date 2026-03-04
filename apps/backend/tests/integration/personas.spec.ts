import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Personas",
  "basePath": "/admin/personas",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Persona 1772649864032",
    "tenant_id": "test-tenant-1",
    "type": "buyer"
  },
  "updatePayload": {
    "name": "Updated Persona"
  }
});
